import Phaser from "phaser";
import { Callbacks, Client, Room } from "@colyseus/sdk";
import {
  applySkyRaidInput,
  defaultSkyRaidInput,
  SKY_GAME_HEIGHT,
  SKY_GAME_WIDTH,
  SKY_INTERPOLATION_FACTOR,
  SKY_PLAYER_COLORS,
  SkyRaidInput,
} from "@alliance/shared";
import { getJoinOptions } from "@/lib/playerIdentity";
import { COLYSEUS_URL } from "../config";

type PlayerView = {
  x: number;
  y: number;
  seat: number;
  score: number;
  kills: number;
  deaths: number;
  alive: boolean;
};

type BulletView = { x: number; y: number };
type EnemyView = { x: number; y: number; kind: number };

type GameCallbacks = {
  onAdd: (
    property: string,
    handler: (item: PlayerView | BulletView | EnemyView, key: string) => void
  ) => void;
  onRemove: (property: string, handler: (item: unknown, key: string) => void) => void;
  onChange: (
    instance: PlayerView | BulletView | EnemyView,
    handler: () => void
  ) => void;
};

export class SkyRaidScene extends Phaser.Scene {
  room?: Room;
  private client = new Client(COLYSEUS_URL);
  private playerSprites = new Map<string, Phaser.GameObjects.Container>();
  private bulletSprites = new Map<string, Phaser.GameObjects.Arc>();
  private enemySprites = new Map<string, Phaser.GameObjects.Shape>();
  private remoteTargets = new Map<string, { x: number; y: number }>();
  private localPredicted = { x: 0, y: 0 };
  private localSessionId?: string;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private hudText?: Phaser.GameObjects.Text;
  private waveText?: Phaser.GameObjects.Text;
  private scrollOffset = 0;
  private stars?: Phaser.GameObjects.Graphics;
  private inputPayload: SkyRaidInput = defaultSkyRaidInput();

  constructor() {
    super("SkyRaidScene");
  }

  create() {
    this.stars = this.add.graphics();
    this.drawStars(0);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys("W,A,S,D,SPACE") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.spaceKey = this.wasd?.SPACE;

    this.hudText = this.add
      .text(12, 12, "Connecting to Sky Raid...", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#9be7ff",
      })
      .setDepth(20)
      .setScrollFactor(0);

    this.waveText = this.add
      .text(SKY_GAME_WIDTH - 12, 12, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ffd166",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(20)
      .setScrollFactor(0);

    this.add
      .text(12, SKY_GAME_HEIGHT - 28, "WASD/Arrows: move  |  Space: shoot  |  6 planes max", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#6f8fa1",
      })
      .setDepth(20)
      .setScrollFactor(0);

    void this.connect();
  }

  private async connect() {
    try {
      this.room = await this.client.joinOrCreate("sky_raid_room", getJoinOptions());
      this.localSessionId = this.room.sessionId;
      const callbacks = Callbacks.get(this.room) as GameCallbacks;

      callbacks.onAdd("players", (player, sessionId) => {
        const view = player as PlayerView;
        const isLocal = sessionId === this.localSessionId;
        const ship = this.createPlane(view.x, view.y, view.seat, isLocal);
        this.playerSprites.set(sessionId, ship);
        this.remoteTargets.set(sessionId, { x: view.x, y: view.y });
        if (isLocal) {
          this.localPredicted = { x: view.x, y: view.y };
          this.updateHud(view);
        }

        callbacks.onChange(view, () => {
          this.remoteTargets.set(sessionId, { x: view.x, y: view.y });
          ship.setAlpha(view.alive ? 1 : 0.2);
          if (isLocal) {
            this.updateHud(view);
            if (!view.alive) {
              this.localPredicted = { x: view.x, y: view.y };
            }
          }
        });
      });

      callbacks.onRemove("players", (_player, sessionId) => {
        this.playerSprites.get(sessionId)?.destroy();
        this.playerSprites.delete(sessionId);
        this.remoteTargets.delete(sessionId);
      });

      callbacks.onAdd("bullets", (bullet, id) => {
        const view = bullet as BulletView;
        const sprite = this.add.circle(view.x, view.y, 3, 0xfff06a).setDepth(3);
        this.bulletSprites.set(id, sprite);
        callbacks.onChange(view, () => sprite.setPosition(view.x, view.y));
      });

      callbacks.onRemove("bullets", (_bullet, id) => {
        this.bulletSprites.get(id)?.destroy();
        this.bulletSprites.delete(id);
      });

      callbacks.onAdd("enemies", (enemy, id) => {
        const view = enemy as EnemyView;
        const sprite = this.createEnemy(view.x, view.y, view.kind);
        this.enemySprites.set(id, sprite);
        callbacks.onChange(view, () => sprite.setPosition(view.x, view.y));
      });

      callbacks.onRemove("enemies", (_enemy, id) => {
        this.enemySprites.get(id)?.destroy();
        this.enemySprites.delete(id);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.hudText?.setText(`Connection failed: ${message}`);
      this.hudText?.setColor("#ff7b7b");
    }
  }

  update(_time: number, delta: number) {
    if (!this.room || !this.cursors) return;
    const dt = delta / (1000 / 60);
    this.scrollOffset += 1.6 * dt;
    this.drawStars(this.scrollOffset);

    this.inputPayload = {
      left: this.cursors.left.isDown || !!this.wasd?.A.isDown,
      right: this.cursors.right.isDown || !!this.wasd?.D.isDown,
      up: this.cursors.up.isDown || !!this.wasd?.W.isDown,
      down: this.cursors.down.isDown || !!this.wasd?.S.isDown,
      shoot: !!this.spaceKey?.isDown,
    };

    const local = this.localSessionId
      ? this.playerSprites.get(this.localSessionId)
      : undefined;

    if (local) {
      applySkyRaidInput(this.localPredicted, this.inputPayload, dt);
      local.setPosition(this.localPredicted.x, this.localPredicted.y);
      this.room.send("input", this.inputPayload);
    }

    this.playerSprites.forEach((sprite, sessionId) => {
      if (sessionId === this.localSessionId) return;
      const target = this.remoteTargets.get(sessionId);
      if (!target) return;
      sprite.x = Phaser.Math.Linear(sprite.x, target.x, SKY_INTERPOLATION_FACTOR);
      sprite.y = Phaser.Math.Linear(sprite.y, target.y, SKY_INTERPOLATION_FACTOR);
    });

    const wave = (this.room.state as { wave?: number })?.wave;
    if (typeof wave === "number") {
      this.waveText?.setText(`Wave ${Math.max(1, wave - 1)}`);
    }
  }

  private updateHud(player: PlayerView) {
    this.hudText?.setText(
      `Score ${player.score}  |  Kills ${player.kills}  |  Deaths ${player.deaths}  |  Seat ${
        player.seat + 1
      }/6`
    );
    this.hudText?.setColor(player.alive ? "#9be7ff" : "#ff9e9e");
  }

  private drawStars(offset: number) {
    if (!this.stars) return;
    this.stars.clear();
    this.stars.fillStyle(0x07111f, 1);
    this.stars.fillRect(0, 0, SKY_GAME_WIDTH, SKY_GAME_HEIGHT);
    for (let i = 0; i < 80; i++) {
      const x = (i * 97) % SKY_GAME_WIDTH;
      const y = (i * 53 + offset * (1 + (i % 3) * 0.35)) % SKY_GAME_HEIGHT;
      this.stars.fillStyle(0xffffff, 0.25 + (i % 4) * 0.15);
      this.stars.fillCircle(x, y, 1 + (i % 2));
    }
  }

  private createPlane(x: number, y: number, seat: number, isLocal: boolean) {
    const color = SKY_PLAYER_COLORS[seat % SKY_PLAYER_COLORS.length];
    const container = this.add.container(x, y);
    const body = this.add.triangle(0, 0, 0, -14, 10, 12, -10, 12, color);
    const wing = this.add.rectangle(0, 2, 22, 4, color, 0.85);
    container.add([wing, body]);
    container.setDepth(isLocal ? 6 : 5);
    return container;
  }

  private createEnemy(x: number, y: number, kind: number) {
    if (kind === 1) {
      return this.add.rectangle(x, y, 22, 22, 0xff8fab).setDepth(4);
    }
    if (kind === 2) {
      return this.add
        .polygon(x, y, [0, -12, 12, 0, 0, 12, -12, 0], 0xc3a6ff)
        .setDepth(4);
    }
    return this.add.circle(x, y, 11, 0xffd166).setDepth(4);
  }
}

export function createSkyRaidGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: SKY_GAME_WIDTH,
    height: SKY_GAME_HEIGHT,
    parent,
    backgroundColor: "#07111f",
    scene: [SkyRaidScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
