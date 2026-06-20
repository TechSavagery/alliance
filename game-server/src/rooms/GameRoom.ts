import { Room, Client } from "colyseus";
import {
  applyPlayerInput,
  BULLET_HIT_RADIUS,
  BULLET_SPEED,
  defaultInput,
  FIRE_COOLDOWN_MS,
  InputPayload,
  INVULN_MS,
  KILL_SCORE,
  MAP_HEIGHT,
  MAP_WIDTH,
  RESPAWN_MS,
  SHIP_HIT_RADIUS,
  TICK_MS,
} from "@alliance/shared";
import { Bullet, GameState, Player } from "@alliance/shared/schema";

export class GameRoom extends Room {
  state = new GameState();

  private inputs = new Map<string, InputPayload>();
  private lastShot = new Map<string, number>();
  private bulletOwners = new Map<string, string>();
  private respawnAt = new Map<string, number>();
  private invulnerableUntil = new Map<string, number>();
  private bulletId = 0;

  onCreate() {
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), TICK_MS);

    this.onMessage("input", (client, payload: InputPayload) => {
      const player = this.state.players.get(client.sessionId);
      if (!player?.alive) return;

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
    this.spawnPlayer(player);

    this.state.players.set(client.sessionId, player);
    this.inputs.set(client.sessionId, defaultInput());
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    this.lastShot.delete(client.sessionId);
    this.respawnAt.delete(client.sessionId);
    this.invulnerableUntil.delete(client.sessionId);
  }

  private update(deltaTime: number) {
    const dt = deltaTime / TICK_MS;

    this.state.players.forEach((player, sessionId) => {
      if (!player.alive) {
        const respawnTime = this.respawnAt.get(sessionId);
        if (respawnTime && Date.now() >= respawnTime) {
          this.respawnPlayer(sessionId, player);
        }
        return;
      }

      const input = this.inputs.get(sessionId);
      if (!input) return;

      applyPlayerInput(player, input, dt);

      if (input.shoot) {
        this.tryShoot(sessionId, player);
      }
    });

    const bulletsToRemove = new Set<string>();

    this.state.bullets.forEach((bullet, bulletId) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (
        bullet.x < -20 ||
        bullet.x > MAP_WIDTH + 20 ||
        bullet.y < -20 ||
        bullet.y > MAP_HEIGHT + 20
      ) {
        bulletsToRemove.add(bulletId);
        return;
      }

      this.state.players.forEach((player, sessionId) => {
        if (!player.alive) return;
        if (this.isInvulnerable(sessionId)) return;

        const ownerId = this.bulletOwners.get(bulletId);
        if (ownerId === sessionId) return;

        const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
        if (dist <= SHIP_HIT_RADIUS + BULLET_HIT_RADIUS) {
          bulletsToRemove.add(bulletId);
          this.handleHit(ownerId, sessionId, player);
        }
      });
    });

    bulletsToRemove.forEach((bulletId) => {
      this.state.bullets.delete(bulletId);
      this.bulletOwners.delete(bulletId);
    });
  }

  private handleHit(
    killerId: string | undefined,
    victimId: string,
    victim: Player
  ) {
    victim.alive = false;
    victim.deaths += 1;
    victim.vx = 0;
    victim.vy = 0;
    this.respawnAt.set(victimId, Date.now() + RESPAWN_MS);

    if (!killerId) return;

    const killer = this.state.players.get(killerId);
    if (!killer) return;

    killer.kills += 1;
    killer.score += KILL_SCORE;
  }

  private respawnPlayer(sessionId: string, player: Player) {
    this.spawnPlayer(player);
    player.alive = true;
    this.respawnAt.delete(sessionId);
    this.invulnerableUntil.set(sessionId, Date.now() + INVULN_MS);
    this.inputs.set(sessionId, defaultInput());
  }

  private spawnPlayer(player: Player) {
    player.x = MAP_WIDTH / 2 + (Math.random() - 0.5) * 240;
    player.y = MAP_HEIGHT / 2 + (Math.random() - 0.5) * 180;
    player.rotation = Math.random() * 360;
    player.vx = 0;
    player.vy = 0;
  }

  private isInvulnerable(sessionId: string) {
    const until = this.invulnerableUntil.get(sessionId);
    return until !== undefined && Date.now() < until;
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

    const bulletId = `b${this.bulletId++}`;
    this.state.bullets.set(bulletId, bullet);
    this.bulletOwners.set(bulletId, sessionId);
  }
}
