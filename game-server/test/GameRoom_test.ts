import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";
import appConfig from "../src/app.config";

describe("Alliance game server", () => {
  let colyseus: ColyseusTestServer;

  before(async () => {
    colyseus = await boot(appConfig);
  });

  after(async () => {
    await colyseus.shutdown();
  });

  beforeEach(async () => {
    await colyseus.cleanup();
  });

  it("connects a client and syncs initial player state", async () => {
    const room = await colyseus.createRoom("game_room", {});
    const client = await colyseus.connectTo(room);

    assert.strictEqual(client.sessionId, room.clients[0].sessionId);

    await room.waitForNextPatch();

    const players = client.state.players;
    assert.ok(players.has(client.sessionId));

    const player = players.get(client.sessionId);
    assert.ok(player.x >= 0 && player.x <= 800);
    assert.ok(player.y >= 0 && player.y <= 600);
  });

  it("moves a player when input is received", async () => {
    const room = await colyseus.createRoom("game_room", {});
    const client = await colyseus.connectTo(room);

    await room.waitForNextPatch();
    const startPlayer = client.state.players.get(client.sessionId);
    const startX = startPlayer.x;
    const startY = startPlayer.y;

    for (let i = 0; i < 20; i++) {
      client.send("input", { left: false, right: false, up: true, shoot: false });
      await room.waitForNextSimulationTick();
    }

    await room.waitForNextPatch();

    const endPlayer = client.state.players.get(client.sessionId);
    const moved = endPlayer.x !== startX || endPlayer.y !== startY;
    assert.ok(moved, "player should move after thrust input");
  });
});
