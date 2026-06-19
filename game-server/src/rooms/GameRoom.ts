import { Room, Client } from "colyseus";
import { Bullet, GameState, Player } from "./schema/GameState";

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;

const ROTATION_SPEED = 4;
const THRUST = 0.2;
const MAX_SPEED = 7;
const FRICTION = 0.99;
const BULLET_SPEED = 10;
const FIRE_COOLDOWN_MS = 200;

export interface InputPayload {
  left: boolean;
  right: boolean;
  up: boolean;
  shoot: boolean;
}

const defaultInput = (): InputPayload => ({
  left: false,
  right: false,
  up: false,
  shoot: false,
});

export class GameRoom extends Room {
  state = new GameState();

  private inputs = new Map<string, InputPayload>();
  private lastShot = new Map<string, number>();
  private bulletId = 0;

  onCreate() {
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / 60);

    this.onMessage("input", (client, payload: InputPayload) => {
      this.inputs.set(client.sessionId, {
        left: !!payload.left,
        right: !!payload.right,
        up: !!payload.up,
        shoot: !!payload.shoot,
      });
    });
  }

  onJoin(client: Client) {
    const player = new Player();
    player.x = MAP_WIDTH / 2 + (Math.random() - 0.5) * 200;
    player.y = MAP_HEIGHT / 2 + (Math.random() - 0.5) * 200;
    player.rotation = Math.random() * 360;

    this.state.players.set(client.sessionId, player);
    this.inputs.set(client.sessionId, defaultInput());
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    this.lastShot.delete(client.sessionId);
  }

  private update(deltaTime: number) {
    const dt = deltaTime / (1000 / 60);

    this.state.players.forEach((player, sessionId) => {
      const input = this.inputs.get(sessionId);
      if (!input) return;

      if (input.left) player.rotation -= ROTATION_SPEED * dt;
      if (input.right) player.rotation += ROTATION_SPEED * dt;

      if (input.up) {
        const rad = (player.rotation * Math.PI) / 180;
        player.vx += Math.sin(rad) * THRUST * dt;
        player.vy += -Math.cos(rad) * THRUST * dt;
      }

      const speed = Math.hypot(player.vx, player.vy);
      if (speed > MAX_SPEED) {
        player.vx = (player.vx / speed) * MAX_SPEED;
        player.vy = (player.vy / speed) * MAX_SPEED;
      }

      player.vx *= FRICTION;
      player.vy *= FRICTION;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      this.wrapPosition(player);

      if (input.shoot) {
        this.tryShoot(sessionId, player);
      }
    });

    const bulletsToRemove: string[] = [];
    this.state.bullets.forEach((bullet, id) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (
        bullet.x < -20 ||
        bullet.x > MAP_WIDTH + 20 ||
        bullet.y < -20 ||
        bullet.y > MAP_HEIGHT + 20
      ) {
        bulletsToRemove.push(id);
      }
    });

    bulletsToRemove.forEach((id) => this.state.bullets.delete(id));
  }

  private wrapPosition(player: Player) {
    if (player.x < 0) player.x = MAP_WIDTH;
    if (player.x > MAP_WIDTH) player.x = 0;
    if (player.y < 0) player.y = MAP_HEIGHT;
    if (player.y > MAP_HEIGHT) player.y = 0;
  }

  private tryShoot(sessionId: string, player: Player) {
    const now = Date.now();
    const last = this.lastShot.get(sessionId) ?? 0;
    if (now - last < FIRE_COOLDOWN_MS) return;

    this.lastShot.set(sessionId, now);

    const rad = (player.rotation * Math.PI) / 180;
    const bullet = new Bullet();
    bullet.x = player.x + Math.sin(rad) * 18;
    bullet.y = player.y - Math.cos(rad) * 18;
    bullet.vx = Math.sin(rad) * BULLET_SPEED + player.vx * 0.5;
    bullet.vy = -Math.cos(rad) * BULLET_SPEED + player.vy * 0.5;

    this.state.bullets.set(`b${this.bulletId++}`, bullet);
  }
}
