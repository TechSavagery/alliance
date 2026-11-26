import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export type MatchRecord = {
  id: number;
  roomId: string;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "ended";
};

export type PlayerStanding = {
  sessionId: string;
  score: number;
  kills: number;
  deaths: number;
  matchesPlayed: number;
};

const DEFAULT_DB_PATH =
  process.env.STATS_DB_PATH ??
  path.join(process.cwd(), "data", "alliance-stats.sqlite");

export class StatsStore {
  private db: Database.Database;

  constructor(dbPath = DEFAULT_DB_PATH) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS match_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        left_at TEXT,
        score INTEGER NOT NULL DEFAULT 0,
        kills INTEGER NOT NULL DEFAULT 0,
        deaths INTEGER NOT NULL DEFAULT 0,
        UNIQUE(match_id, session_id),
        FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS kill_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        killer_session_id TEXT,
        victim_session_id TEXT NOT NULL,
        x REAL,
        y REAL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_matches_room_id ON matches(room_id);
      CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
      CREATE INDEX IF NOT EXISTS idx_kill_events_match_id ON kill_events(match_id);
      CREATE INDEX IF NOT EXISTS idx_kill_events_killer ON kill_events(killer_session_id);
      CREATE INDEX IF NOT EXISTS idx_kill_events_victim ON kill_events(victim_session_id);
    `);
  }

  startMatch(roomId: string): number {
    const result = this.db
      .prepare(
        `INSERT INTO matches (room_id, started_at, status)
         VALUES (?, ?, 'active')`
      )
      .run(roomId, new Date().toISOString());

    return Number(result.lastInsertRowid);
  }

  endMatch(matchId: number) {
    this.db
      .prepare(
        `UPDATE matches
         SET ended_at = ?, status = 'ended'
         WHERE id = ? AND status = 'active'`
      )
      .run(new Date().toISOString(), matchId);
  }

  playerJoined(matchId: number, sessionId: string) {
    this.db
      .prepare(
        `INSERT INTO match_players (match_id, session_id, joined_at)
         VALUES (?, ?, ?)
         ON CONFLICT(match_id, session_id) DO UPDATE SET
           left_at = NULL,
           joined_at = excluded.joined_at`
      )
      .run(matchId, sessionId, new Date().toISOString());
  }

  playerLeft(
    matchId: number,
    sessionId: string,
    stats: { score: number; kills: number; deaths: number }
  ) {
    this.db
      .prepare(
        `UPDATE match_players
         SET left_at = ?, score = ?, kills = ?, deaths = ?
         WHERE match_id = ? AND session_id = ?`
      )
      .run(
        new Date().toISOString(),
        stats.score,
        stats.kills,
        stats.deaths,
        matchId,
        sessionId
      );
  }

  updatePlayerStats(
    matchId: number,
    sessionId: string,
    stats: { score: number; kills: number; deaths: number }
  ) {
    this.db
      .prepare(
        `UPDATE match_players
         SET score = ?, kills = ?, deaths = ?
         WHERE match_id = ? AND session_id = ?`
      )
      .run(stats.score, stats.kills, stats.deaths, matchId, sessionId);
  }

  recordKill(input: {
    matchId: number;
    killerSessionId?: string;
    victimSessionId: string;
    x?: number;
    y?: number;
  }) {
    this.db
      .prepare(
        `INSERT INTO kill_events
          (match_id, killer_session_id, victim_session_id, x, y, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.matchId,
        input.killerSessionId ?? null,
        input.victimSessionId,
        input.x ?? null,
        input.y ?? null,
        new Date().toISOString()
      );
  }

  getSummary() {
    const totals = this.db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM matches) AS matches,
           (SELECT COUNT(*) FROM matches WHERE status = 'active') AS activeMatches,
           (SELECT COUNT(*) FROM match_players) AS playerSessions,
           (SELECT COUNT(*) FROM kill_events) AS kills,
           (SELECT COALESCE(SUM(score), 0) FROM match_players) AS totalScore`
      )
      .get() as {
      matches: number;
      activeMatches: number;
      playerSessions: number;
      kills: number;
      totalScore: number;
    };

    const mostDangerous = this.db
      .prepare(
        `SELECT session_id AS sessionId,
                SUM(kills) AS kills,
                SUM(deaths) AS deaths,
                SUM(score) AS score,
                COUNT(*) AS matchesPlayed
         FROM match_players
         GROUP BY session_id
         ORDER BY kills DESC, score DESC
         LIMIT 5`
      )
      .all() as PlayerStanding[];

    const mostDestroyed = this.db
      .prepare(
        `SELECT session_id AS sessionId,
                SUM(kills) AS kills,
                SUM(deaths) AS deaths,
                SUM(score) AS score,
                COUNT(*) AS matchesPlayed
         FROM match_players
         GROUP BY session_id
         ORDER BY deaths DESC, kills ASC
         LIMIT 5`
      )
      .all() as PlayerStanding[];

    const recentMatches = this.db
      .prepare(
        `SELECT id, room_id AS roomId, started_at AS startedAt,
                ended_at AS endedAt, status
         FROM matches
         ORDER BY id DESC
         LIMIT 10`
      )
      .all() as Array<{
      id: number;
      roomId: string;
      startedAt: string;
      endedAt: string | null;
      status: string;
    }>;

    const recentKills = this.db
      .prepare(
        `SELECT id, match_id AS matchId,
                killer_session_id AS killerSessionId,
                victim_session_id AS victimSessionId,
                x, y, created_at AS createdAt
         FROM kill_events
         ORDER BY id DESC
         LIMIT 20`
      )
      .all();

    return {
      totals,
      mostDangerous,
      mostDestroyed,
      recentMatches,
      recentKills,
    };
  }
}

let singleton: StatsStore | null = null;

export function getStatsStore() {
  if (!singleton) {
    singleton = new StatsStore();
  }
  return singleton;
}
