import Phaser from "phaser";
import { Callbacks, Client, Room } from "@colyseus/sdk";
import { COLYSEUS_URL, GAME_HEIGHT, GAME_WIDTH, InputPayload } from "./config";

export class GameScene extends Phaser.Scene {
  room?: Room;
  private client = new Client(COLYSEUS_URL);
  private playerSprites = new Map<string, Phaser.GameObjects.Container>();
  private bulletSprites = new Map<string, Phaser.GameObjects.Arc>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private statusText?: Phaser.GameObjects.Text;
  private inputPayload: InputPayload = {
    left: false,
    right: false,
    up: false,
    shoot: false,
  };

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
      this.wasd = {
        W: keys.W,
        A: keys.A,
        S: keys.S,
        D: keys.D,
      };
      this.spaceKey = keys.SPACE;
    }

    this.statusText = this.add
      .text(12, 12, "Connecting to server...", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9be7ff",
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.add
      .text(12, GAME_HEIGHT - 28, "WASD/Arrows: move  |  Space: shoot", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#6f8fa1",
      })
      .setScrollFactor(0)
      .setDepth(10);

    void this.connectToRoom();
  }

  private async connectToRoom() {
    try {
      this.room = await this.client.joinOrCreate("game_room");
      this.statusText?.setText(`Connected: ${this.room.sessionId.slice(0, 8)}...`);

      const callbacks = Callbacks.get(this.room) as {
        onAdd: (
          property: string,
          handler: (item: { x: number; y: number; rotation: number }, key: string) => void
        ) => void;
        onRemove: (
          property: string,
          handler: (item: unknown, key: string) => void
        ) => void;
        onChange: (instance: { x: number; y: number; rotation?: number }, handler: () => void) => void;
      };

      callbacks.onAdd("players", (player, sessionId) => {
        const isLocal = sessionId === this.room?.sessionId;
        const ship = this.createShip(player.x, player.y, player.rotation, isLocal);
        this.playerSprites.set(sessionId, ship);

        callbacks.onChange(player, () => {
          ship.setPosition(player.x, player.y);
          ship.setRotation(Phaser.Math.DegToRad(player.rotation));
        });
      });

      callbacks.onRemove("players", (_player, sessionId) => {
        this.playerSprites.get(sessionId)?.destroy();
        this.playerSprites.delete(sessionId);
      });

      callbacks.onAdd("bullets", (bullet, bulletId) => {
        const sprite = this.add.circle(bullet.x, bullet.y, 3, 0xfff06a);
        sprite.setDepth(2);
        this.bulletSprites.set(bulletId, sprite);

        callbacks.onChange(bullet, () => {
          sprite.setPosition(bullet.x, bullet.y);
        });
      });

      callbacks.onRemove("bullets", (_bullet, bulletId) => {
        this.bulletSprites.get(bulletId)?.destroy();
        this.bulletSprites.delete(bulletId);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.statusText?.setText(`Connection failed: ${message}`);
      this.statusText?.setColor("#ff7b7b");
    }
  }

  update() {
    if (!this.room || !this.cursors) return;

    const left = this.cursors.left.isDown || !!this.wasd?.A.isDown;
    const right = this.cursors.right.isDown || !!this.wasd?.D.isDown;
    const up =
      this.cursors.up.isDown ||
      !!this.wasd?.W.isDown ||
      this.cursors.down.isDown ||
      !!this.wasd?.S.isDown;
    const shoot = !!this.spaceKey?.isDown;

    this.inputPayload.left = left;
    this.inputPayload.right = right;
    this.inputPayload.up = up;
    this.inputPayload.shoot = shoot;

    this.room.send("input", this.inputPayload);
  }

  private drawStarfield() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x050814, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const alpha = Phaser.Math.FloatBetween(0.2, 1);
      const size = Phaser.Math.Between(1, 2);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }
  }

  private createShip(x: number, y: number, rotation: number, isLocal = false) {
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

    return container;
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
