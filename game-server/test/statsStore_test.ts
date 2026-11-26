import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { StatsStore } from "../src/persistence/statsStore";

describe("StatsStore persistence", () => {
  const dbPath = path.join(
    os.tmpdir(),
    `alliance-stats-unit-${Date.now()}.sqlite`
  );
  let store: StatsStore;

  before(() => {
    store = new StatsStore(dbPath);
  });

  after(() => {
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${dbPath}${suffix}`;
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("stores matches, players, kills, and leaderboard metrics", () => {
    const matchId = store.startMatch("room-1");
    store.playerJoined(matchId, "ace");
    store.playerJoined(matchId, "target");

    store.recordKill({
      matchId,
      killerSessionId: "ace",
      victimSessionId: "target",
      x: 100,
      y: 200,
    });

    store.updatePlayerStats(matchId, "ace", {
      score: 100,
      kills: 1,
      deaths: 0,
    });
    store.updatePlayerStats(matchId, "target", {
      score: 0,
      kills: 0,
      deaths: 1,
    });

    store.playerLeft(matchId, "ace", { score: 100, kills: 1, deaths: 0 });
    store.playerLeft(matchId, "target", { score: 0, kills: 0, deaths: 1 });
    store.endMatch(matchId);

    const summary = store.getSummary();
    assert.strictEqual(summary.totals.matches, 1);
    assert.strictEqual(summary.totals.kills, 1);
    assert.strictEqual(summary.mostDangerous[0].sessionId, "ace");
    assert.strictEqual(summary.mostDestroyed[0].sessionId, "target");
    assert.strictEqual(summary.recentKills.length, 1);
  });
});
