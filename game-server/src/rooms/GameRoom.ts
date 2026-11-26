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
import { getStatsStore } from "../persistence/statsStore";

export class GameRoom extends Room {
  state = new GameState();

  private inputs = new Map<string, InputPayload>();
  private lastShot = new Map<string, number>();
  private bulletOwners = new Map<string, string>();
  private respawnAt = new Map<string, number>();
  private invulnerableUntil = new Map<string, number>();
  private bulletId = 0;
  private matchId: number | null = null;
  private stats = getStatsStore();

  onCreate() {
    this.matchId = this.stats.startMatch(this.roomId);
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

    if (this.matchId !== null) {
      this.stats.playerJoined(this.matchId, client.sessionId);
    }
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player && this.matchId !== null) {
      this.stats.playerLeft(this.matchId, client.sessionId, {
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
      });
    }

    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    this.lastShot.delete(client.sessionId);
    this.respawnAt.delete(client.sessionId);
    this.invulnerableUntil.delete(client.sessionId);
  }

  onDispose() {
    if (this.matchId === null) return;

    this.state.players.forEach((player, sessionId) => {
      this.stats.updatePlayerStats(this.matchId!, sessionId, {
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
      });
    });

    this.stats.endMatch(this.matchId);
    this.matchId = null;
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

    if (killerId) {
      const killer = this.state.players.get(killerId);
      if (killer) {
        killer.kills += 1;
        killer.score += KILL_SCORE;
        if (this.matchId !== null) {
          this.stats.updatePlayerStats(this.matchId, killerId, {
            score: killer.score,
            kills: killer.kills,
            deaths: killer.deaths,
          });
        }
      }
    }

    if (this.matchId !== null) {
      this.stats.recordKill({
        matchId: this.matchId,
        killerSessionId: killerId,
        victimSessionId: victimId,
        x: victim.x,
        y: victim.y,
      });
      this.stats.updatePlayerStats(this.matchId, victimId, {
        score: victim.score,
        kills: victim.kills,
        deaths: victim.deaths,
      });
    }
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

  getAdminSnapshot() {
    const players: Array<{
      sessionId: string;
      score: number;
      kills: number;
      deaths: number;
      alive: boolean;
      x: number;
      y: number;
    }> = [];

    this.state.players.forEach((player, sessionId) => {
      players.push({
        sessionId,
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
        alive: player.alive,
        x: Math.round(player.x),
        y: Math.round(player.y),
      });
    });

    players.sort((a, b) => b.score - a.score);

    return {
      matchId: this.matchId,
      players,
      bulletCount: this.state.bullets.size,
    };
  }

  adminResetScore(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return false;
    player.score = 0;
    player.kills = 0;
    player.deaths = 0;
    if (this.matchId !== null) {
      this.stats.updatePlayerStats(this.matchId, sessionId, {
        score: 0,
        kills: 0,
        deaths: 0,
      });
    }
    return true;
  }

  adminResetAllScores() {
    this.state.players.forEach((player, sessionId) => {
      player.score = 0;
      player.kills = 0;
      player.deaths = 0;
      if (this.matchId !== null) {
        this.stats.updatePlayerStats(this.matchId, sessionId, {
          score: 0,
          kills: 0,
          deaths: 0,
        });
      }
    });
  }

  adminForceRespawn(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return false;
    this.respawnPlayer(sessionId, player);
    return true;
  }

  adminKick(sessionId: string) {
    const client = this.clients.find((c) => c.sessionId === sessionId);
    if (!client) return false;
    client.leave(4000);
    return true;
  }
}
