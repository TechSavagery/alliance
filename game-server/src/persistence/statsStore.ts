import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export type PlayerStanding = {
  playerId: string;
  displayName: string;
  score: number;
  kills: number;
  deaths: number;
  matchesPlayed: number;
};

export type PlayerGameStats = {
  gameId: string;
  score: number;
  kills: number;
  deaths: number;
  matchesPlayed: number;
};

const DEFAULT_DB_PATH =
  process.env.STATS_DB_PATH ??
  path.join(process.cwd(), "data", "alliance-stats.sqlite");

function hasColumn(
  db: Database.Database,
  table: string,
  column: string
) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return columns.some((entry) => entry.name === column);
}

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
      CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'Pilot',
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        game_id TEXT NOT NULL DEFAULT 'arena',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS match_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        player_id TEXT,
        display_name TEXT NOT NULL DEFAULT 'Pilot',
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
        killer_player_id TEXT,
        victim_player_id TEXT,
        x REAL,
        y REAL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
      );
    `);

    if (!hasColumn(this.db, "matches", "game_id")) {
      this.db.exec(
        `ALTER TABLE matches ADD COLUMN game_id TEXT NOT NULL DEFAULT 'arena'`
      );
    }
    if (!hasColumn(this.db, "match_players", "player_id")) {
      this.db.exec(`ALTER TABLE match_players ADD COLUMN player_id TEXT`);
    }
    if (!hasColumn(this.db, "match_players", "display_name")) {
      this.db.exec(
        `ALTER TABLE match_players ADD COLUMN display_name TEXT NOT NULL DEFAULT 'Pilot'`
      );
    }
    if (!hasColumn(this.db, "kill_events", "killer_player_id")) {
      this.db.exec(`ALTER TABLE kill_events ADD COLUMN killer_player_id TEXT`);
    }
    if (!hasColumn(this.db, "kill_events", "victim_player_id")) {
      this.db.exec(`ALTER TABLE kill_events ADD COLUMN victim_player_id TEXT`);
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_matches_room_id ON matches(room_id);
      CREATE INDEX IF NOT EXISTS idx_matches_game_id ON matches(game_id);
      CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
      CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
      CREATE INDEX IF NOT EXISTS idx_kill_events_match_id ON kill_events(match_id);
      CREATE INDEX IF NOT EXISTS idx_kill_events_killer_player ON kill_events(killer_player_id);
      CREATE INDEX IF NOT EXISTS idx_kill_events_victim_player ON kill_events(victim_player_id);
    `);
  }

  upsertPlayer(playerId: string, displayName = "Pilot") {
    const now = new Date().toISOString();
    const name = displayName.trim().slice(0, 24) || "Pilot";
    this.db
      .prepare(
        `INSERT INTO players (player_id, display_name, created_at, last_seen_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(player_id) DO UPDATE SET
           display_name = excluded.display_name,
           last_seen_at = excluded.last_seen_at`
      )
      .run(playerId, name, now, now);
    return name;
  }

  startMatch(roomId: string, gameId = "arena"): number {
    const result = this.db
      .prepare(
        `INSERT INTO matches (room_id, game_id, started_at, status)
         VALUES (?, ?, ?, 'active')`
      )
      .run(roomId, gameId, new Date().toISOString());

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

  playerJoined(
    matchId: number,
    sessionId: string,
    playerId: string,
    displayName = "Pilot"
  ) {
    const name = this.upsertPlayer(playerId, displayName);
    this.db
      .prepare(
        `INSERT INTO match_players
          (match_id, session_id, player_id, display_name, joined_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(match_id, session_id) DO UPDATE SET
           left_at = NULL,
           player_id = excluded.player_id,
           display_name = excluded.display_name,
           joined_at = excluded.joined_at`
      )
      .run(matchId, sessionId, playerId, name, new Date().toISOString());
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
    killerPlayerId?: string;
    victimPlayerId?: string;
    x?: number;
    y?: number;
  }) {
    this.db
      .prepare(
        `INSERT INTO kill_events
          (match_id, killer_session_id, victim_session_id,
           killer_player_id, victim_player_id, x, y, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.matchId,
        input.killerSessionId ?? null,
        input.victimSessionId,
        input.killerPlayerId ?? null,
        input.victimPlayerId ?? null,
        input.x ?? null,
        input.y ?? null,
        new Date().toISOString()
      );
  }

  getSummary(gameId?: string) {
    const totals = this.db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM matches ${gameId ? "WHERE game_id = ?" : ""}) AS matches,
           (SELECT COUNT(*) FROM matches WHERE status = 'active' ${
             gameId ? "AND game_id = ?" : ""
           }) AS activeMatches,
           (SELECT COUNT(*) FROM match_players mp
              JOIN matches m ON m.id = mp.match_id
              ${gameId ? "WHERE m.game_id = ?" : ""}) AS playerSessions,
           (SELECT COUNT(DISTINCT player_id) FROM match_players mp
              JOIN matches m ON m.id = mp.match_id
              WHERE mp.player_id IS NOT NULL ${
                gameId ? "AND m.game_id = ?" : ""
              }) AS uniquePlayers,
           (SELECT COUNT(*) FROM kill_events ke
              JOIN matches m ON m.id = ke.match_id
              ${gameId ? "WHERE m.game_id = ?" : ""}) AS kills,
           (SELECT COALESCE(SUM(mp.score), 0) FROM match_players mp
              JOIN matches m ON m.id = mp.match_id
              ${gameId ? "WHERE m.game_id = ?" : ""}) AS totalScore`
      )
      .get(
        ...(gameId
          ? [gameId, gameId, gameId, gameId, gameId, gameId]
          : [])
      ) as {
      matches: number;
      activeMatches: number;
      playerSessions: number;
      uniquePlayers: number;
      kills: number;
      totalScore: number;
    };

    const standingQuery = (orderBy: string) =>
      this.db
        .prepare(
          `SELECT
              COALESCE(mp.player_id, mp.session_id) AS playerId,
              COALESCE(MAX(mp.display_name), 'Pilot') AS displayName,
              SUM(mp.kills) AS kills,
              SUM(mp.deaths) AS deaths,
              SUM(mp.score) AS score,
              COUNT(*) AS matchesPlayed
           FROM match_players mp
           JOIN matches m ON m.id = mp.match_id
           ${gameId ? "WHERE m.game_id = ?" : ""}
           GROUP BY COALESCE(mp.player_id, mp.session_id)
           ORDER BY ${orderBy}
           LIMIT 8`
        )
        .all(...(gameId ? [gameId] : [])) as PlayerStanding[];

    const mostDangerous = standingQuery("kills DESC, score DESC");
    const mostDestroyed = standingQuery("deaths DESC, kills ASC");

    const recentMatches = this.db
      .prepare(
        `SELECT id, room_id AS roomId, game_id AS gameId, started_at AS startedAt,
                ended_at AS endedAt, status
         FROM matches
         ${gameId ? "WHERE game_id = ?" : ""}
         ORDER BY id DESC
         LIMIT 10`
      )
      .all(...(gameId ? [gameId] : []));

    const recentKills = this.db
      .prepare(
        `SELECT ke.id, ke.match_id AS matchId,
                ke.killer_session_id AS killerSessionId,
                ke.victim_session_id AS victimSessionId,
                ke.killer_player_id AS killerPlayerId,
                ke.victim_player_id AS victimPlayerId,
                ke.x, ke.y, ke.created_at AS createdAt,
                m.game_id AS gameId
         FROM kill_events ke
         JOIN matches m ON m.id = ke.match_id
         ${gameId ? "WHERE m.game_id = ?" : ""}
         ORDER BY ke.id DESC
         LIMIT 20`
      )
      .all(...(gameId ? [gameId] : []));

    return {
      totals,
      mostDangerous,
      mostDestroyed,
      recentMatches,
      recentKills,
    };
  }

  getPlayerHistory(playerId: string) {
    const player = this.db
      .prepare(
        `SELECT player_id AS playerId, display_name AS displayName,
                created_at AS createdAt, last_seen_at AS lastSeenAt
         FROM players WHERE player_id = ?`
      )
      .get(playerId) as
      | {
          playerId: string;
          displayName: string;
          createdAt: string;
          lastSeenAt: string;
        }
      | undefined;

    const lifetime = this.db
      .prepare(
        `SELECT
            COALESCE(SUM(score), 0) AS score,
            COALESCE(SUM(kills), 0) AS kills,
            COALESCE(SUM(deaths), 0) AS deaths,
            COUNT(*) AS matchesPlayed
         FROM match_players
         WHERE player_id = ?`
      )
      .get(playerId) as {
      score: number;
      kills: number;
      deaths: number;
      matchesPlayed: number;
    };

    const byGame = this.db
      .prepare(
        `SELECT m.game_id AS gameId,
                COALESCE(SUM(mp.score), 0) AS score,
                COALESCE(SUM(mp.kills), 0) AS kills,
                COALESCE(SUM(mp.deaths), 0) AS deaths,
                COUNT(*) AS matchesPlayed
         FROM match_players mp
         JOIN matches m ON m.id = mp.match_id
         WHERE mp.player_id = ?
         GROUP BY m.game_id
         ORDER BY score DESC`
      )
      .all(playerId) as PlayerGameStats[];

    const recentMatches = this.db
      .prepare(
        `SELECT m.id AS matchId, m.game_id AS gameId, m.room_id AS roomId,
                m.started_at AS startedAt, m.ended_at AS endedAt, m.status,
                mp.score, mp.kills, mp.deaths
         FROM match_players mp
         JOIN matches m ON m.id = mp.match_id
         WHERE mp.player_id = ?
         ORDER BY m.id DESC
         LIMIT 20`
      )
      .all(playerId);

    return {
      player: player ?? {
        playerId,
        displayName: "Pilot",
        createdAt: null,
        lastSeenAt: null,
      },
      lifetime,
      byGame,
      recentMatches,
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
