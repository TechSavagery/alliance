import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";
import { KILL_SCORE, MAP_HEIGHT, MAP_WIDTH } from "@alliance/shared";
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

    const player = client.state.players.get(client.sessionId);
    assert.ok(player);
    assert.strictEqual(player.alive, true);
    assert.ok(player.x >= 0 && player.x <= MAP_WIDTH);
    assert.ok(player.y >= 0 && player.y <= MAP_HEIGHT);
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

  it("awards score when a bullet hits another player", async () => {
    const room = await colyseus.createRoom("game_room", {});
    const shooter = await colyseus.connectTo(room);
    const target = await colyseus.connectTo(room);

    await room.waitForNextPatch();

    const shooterState = room.state.players.get(shooter.sessionId);
    const targetState = room.state.players.get(target.sessionId);

    shooterState.x = 100;
    shooterState.y = 300;
    shooterState.rotation = 90;
    targetState.x = 115;
    targetState.y = 300;

    shooter.send("input", { left: false, right: false, up: false, shoot: true });
    await room.waitForNextSimulationTick();
    await room.waitForNextPatch();

    assert.strictEqual(room.state.players.get(shooter.sessionId).kills, 1);
    assert.strictEqual(room.state.players.get(shooter.sessionId).score, KILL_SCORE);
    assert.strictEqual(room.state.players.get(target.sessionId).deaths, 1);
    assert.strictEqual(room.state.players.get(target.sessionId).alive, false);
  });
});
