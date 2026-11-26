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

  it("stores per-game history for stable player identities", () => {
    const arenaMatch = store.startMatch("room-arena", "arena");
    store.playerJoined(arenaMatch, "s1", "pilot-a", "Ace");
    store.playerJoined(arenaMatch, "s2", "pilot-b", "Beacon");
    store.recordKill({
      matchId: arenaMatch,
      killerSessionId: "s1",
      victimSessionId: "s2",
      killerPlayerId: "pilot-a",
      victimPlayerId: "pilot-b",
    });
    store.updatePlayerStats(arenaMatch, "s1", {
      score: 100,
      kills: 1,
      deaths: 0,
    });
    store.updatePlayerStats(arenaMatch, "s2", {
      score: 0,
      kills: 0,
      deaths: 1,
    });
    store.endMatch(arenaMatch);

    const skyMatch = store.startMatch("room-sky", "sky_raid");
    store.playerJoined(skyMatch, "s3", "pilot-a", "Ace");
    store.updatePlayerStats(skyMatch, "s3", {
      score: 150,
      kills: 3,
      deaths: 1,
    });
    store.endMatch(skyMatch);

    const arenaSummary = store.getSummary("arena");
    assert.strictEqual(arenaSummary.totals.matches, 1);
    assert.strictEqual(arenaSummary.mostDangerous[0].playerId, "pilot-a");

    const skySummary = store.getSummary("sky_raid");
    assert.strictEqual(skySummary.totals.matches, 1);
    assert.strictEqual(skySummary.totals.kills, 0);

    const history = store.getPlayerHistory("pilot-a");
    assert.strictEqual(history.lifetime.score, 250);
    assert.strictEqual(history.lifetime.kills, 4);
    assert.strictEqual(history.byGame.length, 2);
    assert.ok(history.byGame.some((entry) => entry.gameId === "arena"));
    assert.ok(history.byGame.some((entry) => entry.gameId === "sky_raid"));
  });
});
