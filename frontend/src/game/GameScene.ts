import Phaser from "phaser";
import { Callbacks, Client, Room } from "@colyseus/sdk";
import {
  applyPlayerInput,
  copyPlayerState,
  defaultInput,
  INTERPOLATION_FACTOR,
  InputPayload,
  MAP_HEIGHT,
  MAP_WIDTH,
  RECONCILE_THRESHOLD,
  SimulatedPlayer,
} from "@alliance/shared";
import { COLYSEUS_URL, GAME_HEIGHT, GAME_WIDTH } from "./config";

type PlayerView = SimulatedPlayer & {
  kills: number;
  deaths: number;
  score: number;
  alive: boolean;
};

type BulletView = {
  x: number;
  y: number;
};

interface PlayerRenderState {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Triangle;
  isLocal: boolean;
  server: SimulatedPlayer;
  predicted: SimulatedPlayer;
  kills: number;
  deaths: number;
  score: number;
  alive: boolean;
}

interface BulletRenderState {
  sprite: Phaser.GameObjects.Arc;
  serverX: number;
  serverY: number;
}

type GameCallbacks = {
  onAdd: (property: string, handler: (item: PlayerView | BulletView, key: string) => void) => void;
  onRemove: (property: string, handler: (item: unknown, key: string) => void) => void;
  onChange: (instance: PlayerView | BulletView, handler: () => void) => void;
  listen: (
    instance: PlayerView,
    property: keyof PlayerView,
    handler: (value: number | boolean) => void
  ) => void;
};

export class GameScene extends Phaser.Scene {
  room?: Room;
  private client = new Client(COLYSEUS_URL);
  private playerEntities = new Map<string, PlayerRenderState>();
  private bulletEntities = new Map<string, BulletRenderState>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private hudText?: Phaser.GameObjects.Text;
  private leaderboardText?: Phaser.GameObjects.Text;
  private inputPayload: InputPayload = defaultInput();

  constructor() {
    super("GameScene");
  }

  create() {
    this.drawStarfield();
    this.cursors = this.input.keyboard?.createCursorKeys();
    const keys = this.input.keyboard?.addKeys("W,A,S,D,SPACE") as
      | Record<string, Phaser.Input.Keyboard.Key>
      | undefined;

    if (keys) {
      this.wasd = { W: keys.W, A: keys.A, S: keys.S, D: keys.D };
      this.spaceKey = keys.SPACE;
    }

    this.hudText = this.add
      .text(12, 12, "Connecting...", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#9be7ff",
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.leaderboardText = this.add
      .text(GAME_WIDTH - 12, 12, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#8aa6b8",
        align: "right",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20);

    this.add
      .text(12, GAME_HEIGHT - 28, "WASD/Arrows: fly  |  Space: shoot", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#6f8fa1",
      })
      .setScrollFactor(0)
      .setDepth(20);

    void this.connectToRoom();
  }

  private async connectToRoom() {
    try {
      this.room = await this.client.joinOrCreate("game_room");
      const callbacks = Callbacks.get(this.room) as GameCallbacks;

      callbacks.onAdd("players", (player, sessionId) => {
        const view = player as PlayerView;
        const isLocal = sessionId === this.room?.sessionId;
        const { container, body } = this.createShip(
          view.x,
          view.y,
          view.rotation,
          isLocal
        );

        const entity: PlayerRenderState = {
          container,
          body,
          isLocal,
          server: copyPlayerState(view),
          predicted: copyPlayerState(view),
          kills: view.kills,
          deaths: view.deaths,
          score: view.score,
          alive: view.alive,
        };

        this.playerEntities.set(sessionId, entity);
        this.applyAliveVisual(entity);

        callbacks.onChange(view, () => {
          entity.server = copyPlayerState(view);
          entity.alive = view.alive;
          entity.kills = view.kills;
          entity.deaths = view.deaths;
          entity.score = view.score;
          this.applyAliveVisual(entity);

          if (entity.isLocal) {
            this.reconcileLocalPlayer(entity);
            this.updateHud(entity);
          }
        });

        if (isLocal) {
          callbacks.listen(view, "kills", () => {
            entity.kills = view.kills;
            this.updateHud(entity);
          });
          callbacks.listen(view, "deaths", () => {
            entity.deaths = view.deaths;
            this.updateHud(entity);
          });
          callbacks.listen(view, "score", () => {
            entity.score = view.score;
            this.updateHud(entity);
          });
          this.updateHud(entity);
        }
      });

      callbacks.onRemove("players", (_player, sessionId) => {
        this.playerEntities.get(sessionId)?.container.destroy();
        this.playerEntities.delete(sessionId);
        this.refreshLeaderboard();
      });

      callbacks.onAdd("bullets", (bullet, bulletId) => {
        const view = bullet as BulletView;
        const sprite = this.add.circle(view.x, view.y, 3, 0xfff06a);
        sprite.setDepth(2);

        this.bulletEntities.set(bulletId, {
          sprite,
          serverX: view.x,
          serverY: view.y,
        });

        callbacks.onChange(view, () => {
          const entity = this.bulletEntities.get(bulletId);
          if (!entity) return;
          entity.serverX = view.x;
          entity.serverY = view.y;
        });
      });

      callbacks.onRemove("bullets", (_bullet, bulletId) => {
        this.bulletEntities.get(bulletId)?.sprite.destroy();
        this.bulletEntities.delete(bulletId);
      });

      this.refreshLeaderboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.hudText?.setText(`Connection failed: ${message}`);
      this.hudText?.setColor("#ff7b7b");
    }
  }

  update(_time: number, delta: number) {
    if (!this.room || !this.cursors) return;

    const dt = delta / (1000 / 60);
    this.inputPayload = this.readInput();

    this.playerEntities.forEach((entity) => {
      if (entity.isLocal) {
        if (entity.alive) {
          applyPlayerInput(entity.predicted, this.inputPayload, dt);
          entity.container.setPosition(entity.predicted.x, entity.predicted.y);
          entity.container.setRotation(Phaser.Math.DegToRad(entity.predicted.rotation));
        }
      } else {
        entity.container.x = Phaser.Math.Linear(
          entity.container.x,
          entity.server.x,
          INTERPOLATION_FACTOR
        );
        entity.container.y = Phaser.Math.Linear(
          entity.container.y,
          entity.server.y,
          INTERPOLATION_FACTOR
        );
        entity.container.rotation = Phaser.Math.Linear(
          entity.container.rotation,
          Phaser.Math.DegToRad(entity.server.rotation),
          INTERPOLATION_FACTOR
        );
      }
    });

    this.bulletEntities.forEach((entity) => {
      entity.sprite.x = Phaser.Math.Linear(
        entity.sprite.x,
        entity.serverX,
        0.35
      );
      entity.sprite.y = Phaser.Math.Linear(
        entity.sprite.y,
        entity.serverY,
        0.35
      );
    });

    if (this.playerEntities.get(this.room.sessionId)?.alive) {
      this.room.send("input", this.inputPayload);
    }

    this.refreshLeaderboard();
  }

  private readInput(): InputPayload {
    return {
      left: this.cursors!.left.isDown || !!this.wasd?.A.isDown,
      right: this.cursors!.right.isDown || !!this.wasd?.D.isDown,
      up:
        this.cursors!.up.isDown ||
        !!this.wasd?.W.isDown ||
        this.cursors!.down.isDown ||
        !!this.wasd?.S.isDown,
      shoot: !!this.spaceKey?.isDown,
    };
  }

  private reconcileLocalPlayer(entity: PlayerRenderState) {
    const dx = entity.server.x - entity.predicted.x;
    const dy = entity.server.y - entity.predicted.y;
    const dist = Math.hypot(dx, dy);

    if (!entity.alive) {
      entity.predicted = copyPlayerState(entity.server);
      entity.container.setPosition(entity.server.x, entity.server.y);
      entity.container.setRotation(Phaser.Math.DegToRad(entity.server.rotation));
      return;
    }

    if (dist > RECONCILE_THRESHOLD) {
      entity.predicted = copyPlayerState(entity.server);
      entity.container.setPosition(entity.server.x, entity.server.y);
      entity.container.setRotation(Phaser.Math.DegToRad(entity.server.rotation));
      return;
    }

    entity.predicted.vx = entity.server.vx;
    entity.predicted.vy = entity.server.vy;
  }

  private updateHud(entity: PlayerRenderState) {
    this.hudText?.setText(
      `Score ${entity.score}  |  Kills ${entity.kills}  |  Deaths ${entity.deaths}`
    );
    this.hudText?.setColor(entity.alive ? "#9be7ff" : "#ff9e9e");
  }

  private refreshLeaderboard() {
    const rows = Array.from(this.playerEntities.entries())
      .filter(([, entity]) => entity.alive || entity.score > 0)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 4)
      .map(([sessionId, entity], index) => {
        const tag = sessionId === this.room?.sessionId ? "*" : " ";
        return `${index + 1}.${tag} ${entity.score} (${entity.kills}K)`;
      });

    this.leaderboardText?.setText(rows.length ? rows.join("\n") : "");
  }

  private applyAliveVisual(entity: PlayerRenderState) {
    entity.container.setAlpha(entity.alive ? 1 : 0.15);
    entity.container.setScale(entity.alive ? 1 : 0.85);
  }

  private drawStarfield() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x050814, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 120; i++) {
      graphics.fillStyle(
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 1)
      );
      graphics.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 2)
      );
    }
  }

  private createShip(x: number, y: number, rotation: number, isLocal: boolean) {
    const container = this.add.container(x, y);
    const body = this.add.triangle(
      0,
      0,
      0,
      -16,
      12,
      12,
      -12,
      12,
      isLocal ? 0x7dffb3 : 0x58f5ff
    );
    const cockpit = this.add.triangle(0, -2, 0, -8, 4, 2, -4, 2, 0x0d1b2a);
    const flame = this.add.triangle(0, 14, 0, 22, 5, 12, -5, 12, 0xff8c42);

    container.add([flame, body, cockpit]);
    container.setRotation(Phaser.Math.DegToRad(rotation));
    container.setDepth(5);

    return { container, body };
  }
}

export function createPhaserGame(parent: HTMLElement) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: "#050814",
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  return new Phaser.Game(config);
}
