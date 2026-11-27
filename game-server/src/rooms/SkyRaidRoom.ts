import { Room, Client } from "colyseus";
import {
  applySkyRaidInput,
  defaultSkyRaidInput,
  SKY_BULLET_HIT_RADIUS,
  SKY_BULLET_SPEED,
  SKY_ENEMY_HIT_RADIUS,
  SKY_ENEMY_SCORE,
  SKY_FIRE_COOLDOWN_MS,
  SKY_INVULN_MS,
  SKY_MAP_HEIGHT,
  SKY_MAP_WIDTH,
  SKY_MAX_PLAYERS,
  SKY_PLAYER_HIT_RADIUS,
  SKY_PLAYER_MAX_Y,
  SKY_PLAYER_MIN_Y,
  SKY_RESPAWN_MS,
  SKY_SCROLL_SPEED,
  SKY_TICK_MS,
  SKY_WAVE_INTERVAL_MS,
  SkyRaidInput,
  SKY_POWERUP_DROP_CHANCE,
  SKY_MULTIPLIER_DROP_CHANCE,
  SKY_POWERUP_DRIFT_SPEED,
  SKY_POWERUP_COLLECT_RADIUS,
  SKY_MULTIPLIER_DURATION_MS,
  SKY_MAX_SHIELDS,
  SKY_MAX_BOMBS,
  SKY_MAX_POWER_LEVEL,
  SKY_MAX_SPEED_LEVEL,
  SKY_POWER_LEVEL_COOLDOWNS,
  SKY_REVIVE_RADIUS,
  SKY_REVIVE_TIME_MS,
  SKY_REVIVE_REWARD,
} from "@alliance/shared";
import {
  SkyRaidBullet,
  SkyRaidEnemy,
  SkyRaidPlayer,
  SkyRaidPowerUp,
  SkyRaidState,
} from "@alliance/shared/games/skyRaid/schema";
import { getStatsStore } from "../persistence/statsStore";

export class SkyRaidRoom extends Room {
  state = new SkyRaidState();
  maxClients = SKY_MAX_PLAYERS;

  private inputs = new Map<string, SkyRaidInput>();
  private lastShot = new Map<string, number>();
  private respawnAt = new Map<string, number>();
  private invulnerableUntil = new Map<string, number>();
  private seats = new Map<string, number>();
  private reviveStartTime = new Map<string, number>();
  private bulletId = 0;
  private enemyId = 0;
  private powerUpId = 0;
  private nextWaveAt = 0;
  private matchId: number | null = null;
  private stats = getStatsStore();
  private playerIds = new Map<string, string>();
  private displayNames = new Map<string, string>();

  private sessionStartTime = 0;

  onCreate(options: { gameMode?: string } = {}) {
    this.matchId = this.stats.startMatch(this.roomId, "sky_raid");
    this.sessionStartTime = Date.now();
    this.nextWaveAt = Date.now() + 800;
    
    if (options.gameMode === "ffa") {
      this.state.gameMode = "ffa";
    } else {
      this.state.gameMode = "coop";
    }
    
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), SKY_TICK_MS);

    this.onMessage("input", (client, payload: SkyRaidInput) => {
      const player = this.state.players.get(client.sessionId);
      if (!player?.alive) return;

      this.inputs.set(client.sessionId, {
        left: !!payload.left,
        right: !!payload.right,
        up: !!payload.up,
        down: !!payload.down,
        shoot: !!payload.shoot,
      });
    });
  }

  onJoin(client: Client, options: { playerId?: string; displayName?: string } = {}) {
    const playerId =
      typeof options.playerId === "string" && options.playerId.trim()
        ? options.playerId.trim().slice(0, 64)
        : `anon_${client.sessionId}`;
    const displayName =
      typeof options.displayName === "string" && options.displayName.trim()
        ? options.displayName.trim().slice(0, 24)
        : "Pilot";

    const seat = this.nextSeat();
    const player = new SkyRaidPlayer();
    player.seat = seat;
    this.spawnPlayer(player, seat);

    this.state.players.set(client.sessionId, player);
    this.seats.set(client.sessionId, seat);
    this.inputs.set(client.sessionId, defaultSkyRaidInput());
    this.playerIds.set(client.sessionId, playerId);
    this.displayNames.set(client.sessionId, displayName);

    if (this.matchId !== null) {
      this.stats.playerJoined(
        this.matchId,
        client.sessionId,
        playerId,
        displayName
      );
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
    this.seats.delete(client.sessionId);
    this.playerIds.delete(client.sessionId);
    this.displayNames.delete(client.sessionId);
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
    const dt = deltaTime / SKY_TICK_MS;
    this.state.scrollY += SKY_SCROLL_SPEED * dt;
    this.state.sessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);

    if (Date.now() >= this.nextWaveAt) {
      this.spawnWave();
      const difficultyMult = Math.min(2.0, 1.0 + this.state.sessionTime / 1800);
      this.nextWaveAt = Date.now() + Math.max(1100, SKY_WAVE_INTERVAL_MS / difficultyMult);
    }

    this.state.players.forEach((player, sessionId) => {
      if (player.multiplier > 1.0 && Date.now() >= player.multiplierEnds) {
        player.multiplier = 1.0;
        player.multiplierEnds = 0;
      }

      if (!player.alive) {
        player.reviveProgress = 0;
        
        if (this.state.gameMode === "coop") {
          let anyoneNearby = false;
          this.state.players.forEach((otherPlayer, otherSessionId) => {
            if (otherSessionId === sessionId || !otherPlayer.alive) return;
            const dist = Math.hypot(player.x - otherPlayer.x, player.y - otherPlayer.y);
            if (dist <= SKY_REVIVE_RADIUS) {
              anyoneNearby = true;
            }
          });

          if (anyoneNearby) {
            if (!this.reviveStartTime.has(sessionId)) {
              this.reviveStartTime.set(sessionId, Date.now());
            }
            const elapsed = Date.now() - this.reviveStartTime.get(sessionId)!;
            player.reviveProgress = Math.min(1.0, elapsed / SKY_REVIVE_TIME_MS);
            
            if (elapsed >= SKY_REVIVE_TIME_MS) {
              this.revivePlayer(sessionId, player);
            }
          } else {
            this.reviveStartTime.delete(sessionId);
          }
        } else {
          const when = this.respawnAt.get(sessionId);
          if (when && Date.now() >= when) {
            this.respawnPlayer(sessionId, player);
          }
        }
        return;
      }

      const input = this.inputs.get(sessionId);
      if (!input) return;

      applySkyRaidInput(player, input, dt);
      if (input.shoot) this.tryShoot(sessionId, player);
    });

    const bulletsToRemove = new Set<string>();
    this.state.bullets.forEach((bullet, id) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.y < -20 || bullet.y > SKY_MAP_HEIGHT + 20 || bullet.x < -20 || bullet.x > SKY_MAP_WIDTH + 20) {
        bulletsToRemove.add(id);
      }
    });

    const enemiesToRemove = new Set<string>();
    this.state.enemies.forEach((enemy, id) => {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      if (enemy.kind === 0) {
        enemy.x += Math.sin((this.state.scrollY + enemy.y) * 0.05) * 0.6 * dt;
      }

      if (
        enemy.y > SKY_MAP_HEIGHT + 40 ||
        enemy.x < -40 ||
        enemy.x > SKY_MAP_WIDTH + 40
      ) {
        enemiesToRemove.add(id);
      }
    });

    const powerUpsToRemove = new Set<string>();
    this.state.powerUps.forEach((powerUp, id) => {
      powerUp.y += powerUp.vy * dt;

      if (powerUp.y > SKY_MAP_HEIGHT + 20) {
        powerUpsToRemove.add(id);
        return;
      }

      this.state.players.forEach((player, sessionId) => {
        if (!player.alive) return;
        const dist = Math.hypot(powerUp.x - player.x, powerUp.y - player.y);
        if (dist <= SKY_POWERUP_COLLECT_RADIUS) {
          this.collectPowerUp(sessionId, player, powerUp.type);
          powerUpsToRemove.add(id);
        }
      });
    });

    this.state.bullets.forEach((bullet, bulletId) => {
      this.state.enemies.forEach((enemy, enemyId) => {
        if (enemiesToRemove.has(enemyId)) return;
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist <= SKY_ENEMY_HIT_RADIUS + SKY_BULLET_HIT_RADIUS) {
          enemy.hp -= 1;
          bulletsToRemove.add(bulletId);
          if (enemy.hp <= 0) {
            enemiesToRemove.add(enemyId);
            this.awardKill(bullet.ownerId, enemy.x, enemy.y);
          }
        }
      });
    });

    this.state.enemies.forEach((enemy, enemyId) => {
      this.state.players.forEach((player, sessionId) => {
        if (!player.alive || this.isInvulnerable(sessionId)) return;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= SKY_ENEMY_HIT_RADIUS + SKY_PLAYER_HIT_RADIUS) {
          this.killPlayer(sessionId, player);
          if (enemy.kind !== 1) {
            enemiesToRemove.add(enemyId);
          }
        }
      });
    });

    bulletsToRemove.forEach((id) => this.state.bullets.delete(id));
    enemiesToRemove.forEach((id) => this.state.enemies.delete(id));
    powerUpsToRemove.forEach((id) => this.state.powerUps.delete(id));
  }

  private collectPowerUp(sessionId: string, player: SkyRaidPlayer, type: number) {
    switch (type) {
      case 0:
        if (player.powerLevel < SKY_MAX_POWER_LEVEL) {
          player.powerLevel += 1;
        }
        break;
      case 1:
        if (player.speedLevel < SKY_MAX_SPEED_LEVEL) {
          player.speedLevel += 1;
        }
        break;
      case 2:
        if (player.shields < SKY_MAX_SHIELDS) {
          player.shields += 1;
        }
        break;
      case 3:
        if (player.bombs < SKY_MAX_BOMBS) {
          player.bombs += 1;
        }
        break;
      case 4:
        if (player.multiplier < 4.0) {
          player.multiplier = Math.min(4.0, player.multiplier + 1.0);
        }
        player.multiplierEnds = Date.now() + SKY_MULTIPLIER_DURATION_MS;
        break;
    }
  }

  private awardKill(ownerId: string, x: number, y: number) {
    const player = this.state.players.get(ownerId);
    if (!player) return;

    player.kills += 1;
    const baseScore = SKY_ENEMY_SCORE * player.multiplier;
    player.score += Math.floor(baseScore);

    this.tryDropPowerUp(x, y);

    if (this.matchId !== null) {
      this.stats.recordKill({
        matchId: this.matchId,
        killerSessionId: ownerId,
        victimSessionId: "enemy",
        killerPlayerId: this.playerIds.get(ownerId),
        victimPlayerId: "enemy",
        x,
        y,
      });
      this.stats.updatePlayerStats(this.matchId, ownerId, {
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
      });
    }
  }

  private tryDropPowerUp(x: number, y: number) {
    if (Math.random() > SKY_POWERUP_DROP_CHANCE) return;

    const powerUp = new SkyRaidPowerUp();
    powerUp.x = x;
    powerUp.y = y;
    powerUp.vy = SKY_POWERUP_DRIFT_SPEED;

    if (Math.random() < SKY_MULTIPLIER_DROP_CHANCE) {
      powerUp.type = 4;
    } else {
      powerUp.type = Math.floor(Math.random() * 4);
    }

    this.state.powerUps.set(`p${this.powerUpId++}`, powerUp);
  }

  private killPlayer(sessionId: string, player: SkyRaidPlayer) {
    if (player.shields > 0) {
      player.shields -= 1;
      this.invulnerableUntil.set(sessionId, Date.now() + 500);
      return;
    }

    player.alive = false;
    player.deaths += 1;
    this.respawnAt.set(sessionId, Date.now() + SKY_RESPAWN_MS);

    player.powerLevel = 1;
    player.speedLevel = 1;
    player.bombs = 0;
    player.multiplier = 1.0;
    player.multiplierEnds = 0;

    if (this.matchId !== null) {
      this.stats.updatePlayerStats(this.matchId, sessionId, {
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
      });
    }
  }

  private spawnWave() {
    const wave = this.state.wave;
    const minutes = this.state.sessionTime / 60;
    
    const hpMult = Math.min(2.5, 1.0 + minutes * 0.03);
    const speedMult = Math.min(2.8, 1.0 + minutes * 0.04);
    const count = Math.min(3 + Math.floor(wave / 2) + Math.floor(minutes / 3), 15);
    
    const kind = wave % 3;

    for (let i = 0; i < count; i++) {
      const enemy = new SkyRaidEnemy();
      enemy.kind = kind;
      enemy.x = 60 + ((SKY_MAP_WIDTH - 120) / Math.max(count - 1, 1)) * i;
      enemy.y = -20 - i * 18;
      enemy.vx = kind === 0 ? (i % 2 === 0 ? 0.8 : -0.8) * speedMult : 0;
      enemy.vy = (kind === 1 ? 1.1 + wave * 0.05 : 1.8 + wave * 0.08) * speedMult;
      enemy.hp = Math.ceil((kind === 1 ? 3 : kind === 2 ? 2 : 1) * hpMult);

      this.state.enemies.set(`e${this.enemyId++}`, enemy);
    }

    this.state.wave += 1;
  }

  private tryShoot(sessionId: string, player: SkyRaidPlayer) {
    const now = Date.now();
    const last = this.lastShot.get(sessionId) ?? 0;
    const cooldown = SKY_POWER_LEVEL_COOLDOWNS[player.powerLevel] ?? SKY_FIRE_COOLDOWN_MS;
    if (now - last < cooldown) return;
    this.lastShot.set(sessionId, now);

    const bulletCount = Math.min(player.powerLevel, 5);
    const spreadAngle = bulletCount > 1 ? 15 : 0;

    for (let i = 0; i < bulletCount; i++) {
      const bullet = new SkyRaidBullet();
      bullet.x = player.x;
      bullet.y = player.y - 16;
      bullet.ownerId = sessionId;
      bullet.vx = 0;
      bullet.vy = -SKY_BULLET_SPEED;

      if (bulletCount > 1) {
        const angleOffset = (i - (bulletCount - 1) / 2) * spreadAngle;
        const radians = (angleOffset * Math.PI) / 180;
        bullet.vx = SKY_BULLET_SPEED * Math.sin(radians);
        bullet.vy = -SKY_BULLET_SPEED * Math.cos(radians);
      }

      this.state.bullets.set(`b${this.bulletId++}`, bullet);
    }
  }

  private nextSeat() {
    const used = new Set(this.seats.values());
    for (let seat = 0; seat < SKY_MAX_PLAYERS; seat++) {
      if (!used.has(seat)) return seat;
    }
    return Math.max(0, this.clients.length % SKY_MAX_PLAYERS);
  }

  private spawnPlayer(player: SkyRaidPlayer, seat: number) {
    const laneWidth = SKY_MAP_WIDTH / SKY_MAX_PLAYERS;
    player.x = laneWidth * seat + laneWidth / 2;
    player.y = (SKY_PLAYER_MIN_Y + SKY_PLAYER_MAX_Y) / 2;
  }

  private respawnPlayer(sessionId: string, player: SkyRaidPlayer) {
    this.spawnPlayer(player, player.seat);
    player.alive = true;
    this.respawnAt.delete(sessionId);
    this.invulnerableUntil.set(sessionId, Date.now() + SKY_INVULN_MS);
    this.inputs.set(sessionId, defaultSkyRaidInput());
  }

  private revivePlayer(sessionId: string, player: SkyRaidPlayer) {
    this.spawnPlayer(player, player.seat);
    player.alive = true;
    player.shields = 1;
    player.powerLevel = 1;
    player.speedLevel = 1;
    player.reviveProgress = 0;
    this.reviveStartTime.delete(sessionId);
    this.respawnAt.delete(sessionId);
    this.invulnerableUntil.set(sessionId, Date.now() + SKY_INVULN_MS);
    this.inputs.set(sessionId, defaultSkyRaidInput());

    this.state.players.forEach((otherPlayer, otherSessionId) => {
      if (otherSessionId === sessionId || !otherPlayer.alive) return;
      const dist = Math.hypot(player.x - otherPlayer.x, player.y - otherPlayer.y);
      if (dist <= SKY_REVIVE_RADIUS) {
        otherPlayer.score += SKY_REVIVE_REWARD;
        otherPlayer.revives += 1;
      }
    });
  }

  private isInvulnerable(sessionId: string) {
    const until = this.invulnerableUntil.get(sessionId);
    return until !== undefined && Date.now() < until;
  }

  getAdminSnapshot() {
    const players: Array<{
      sessionId: string;
      playerId?: string;
      displayName?: string;
      score: number;
      kills: number;
      deaths: number;
      alive: boolean;
      x: number;
      y: number;
      seat?: number;
    }> = [];

    this.state.players.forEach((player, sessionId) => {
      players.push({
        sessionId,
        playerId: this.playerIds.get(sessionId),
        displayName: this.displayNames.get(sessionId),
        score: player.score,
        kills: player.kills,
        deaths: player.deaths,
        alive: player.alive,
        x: Math.round(player.x),
        y: Math.round(player.y),
        seat: player.seat,
      });
    });

    players.sort((a, b) => b.score - a.score);

    return {
      matchId: this.matchId,
      gameId: "sky_raid",
      players,
      bulletCount: this.state.bullets.size,
      enemyCount: this.state.enemies.size,
      wave: this.state.wave,
    };
  }

  adminResetScore(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return false;
    player.score = 0;
    player.kills = 0;
    player.deaths = 0;
    return true;
  }

  adminResetAllScores() {
    this.state.players.forEach((player) => {
      player.score = 0;
      player.kills = 0;
      player.deaths = 0;
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
