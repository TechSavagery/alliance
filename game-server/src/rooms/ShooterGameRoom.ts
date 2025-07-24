import { Room, Client } from "colyseus";
import { ShooterGameState, Player, Enemy, Projectile } from "./schema/ShooterGameState";

export interface PlayerRole {
  GUNNER: "gunner";
  ENGINEER: "engineer";
  MEDIC: "medic";
}

export class ShooterGameRoom extends Room<ShooterGameState> {
  private gameLoopInterval: NodeJS.Timeout;
  private spawnEnemyInterval: NodeJS.Timeout;
  private gameSpeed = 1000 / 60; // 60 FPS
  private waveNumber = 1;
  private enemiesPerWave = 5;
  private maxClients = 4;

  onCreate(options: any) {
    this.setState(new ShooterGameState());
    this.setMaxClients(this.maxClients);

    // Handle player actions
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = Math.max(0, Math.min(800, message.x));
        player.y = Math.max(0, Math.min(600, message.y));
        player.rotation = message.rotation || 0;
      }
    });

    this.onMessage("shoot", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.canShoot()) {
        this.createProjectile(player, message.direction);
        player.lastShotTime = Date.now();
      }
    });

    this.onMessage("heal", (client, message) => {
      const healer = this.state.players.get(client.sessionId);
      if (healer && healer.role === "medic" && healer.canHeal()) {
        const targetPlayer = this.state.players.get(message.targetId);
        if (targetPlayer && this.getDistance(healer, targetPlayer) <= 100) {
          targetPlayer.health = Math.min(100, targetPlayer.health + 25);
          healer.lastHealTime = Date.now();
        }
      }
    });

    this.onMessage("repair", (client, message) => {
      const engineer = this.state.players.get(client.sessionId);
      if (engineer && engineer.role === "engineer" && engineer.canRepair()) {
        // Repair base or create barriers
        if (message.type === "base") {
          this.state.baseHealth = Math.min(100, this.state.baseHealth + 15);
        }
        engineer.lastRepairTime = Date.now();
      }
    });

    // Start game loop
    this.gameLoopInterval = setInterval(() => {
      this.updateGame();
    }, this.gameSpeed);

    // Start enemy spawning
    this.spawnEnemyInterval = setInterval(() => {
      this.spawnEnemies();
    }, 3000);
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    
    // Assign role based on team composition
    const role = this.assignRole();
    const player = new Player();
    player.id = client.sessionId;
    player.role = role;
    player.x = 400;
    player.y = 500;
    player.health = 100;
    player.score = 0;

    this.state.players.set(client.sessionId, player);
    this.state.teamScore += 0; // Initialize team participation
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    clearInterval(this.gameLoopInterval);
    clearInterval(this.spawnEnemyInterval);
  }

  private assignRole(): string {
    const players = Array.from(this.state.players.values());
    const gunners = players.filter(p => p.role === "gunner").length;
    const engineers = players.filter(p => p.role === "engineer").length;
    const medics = players.filter(p => p.role === "medic").length;

    // Balanced team composition: prioritize gunners, then engineer, then medic
    if (gunners < 2) return "gunner";
    if (engineers < 1) return "engineer";
    if (medics < 1) return "medic";
    return "gunner";
  }

  private updateGame() {
    // Update projectiles
    this.state.projectiles.forEach((projectile, id) => {
      projectile.x += Math.cos(projectile.direction) * projectile.speed;
      projectile.y += Math.sin(projectile.direction) * projectile.speed;

      // Remove projectiles that are off-screen
      if (projectile.x < 0 || projectile.x > 800 || projectile.y < 0 || projectile.y > 600) {
        this.state.projectiles.delete(id);
      }
    });

    // Update enemies
    this.state.enemies.forEach((enemy, id) => {
      // Move enemies toward base
      const dx = 400 - enemy.x;
      const dy = 550 - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
      } else {
        // Enemy reached base
        this.state.baseHealth -= enemy.damage;
        this.state.enemies.delete(id);
      }
    });

    // Check collisions
    this.checkCollisions();

    // Check game over conditions
    if (this.state.baseHealth <= 0) {
      this.state.gameStatus = "lost";
      this.broadcast("gameOver", { result: "defeat", teamScore: this.state.teamScore });
    }

    // Check wave completion
    if (this.state.enemies.size === 0 && this.state.enemiesSpawned >= this.enemiesPerWave) {
      this.nextWave();
    }
  }

  private createProjectile(player: Player, direction: number) {
    const projectile = new Projectile();
    projectile.id = `${player.id}_${Date.now()}`;
    projectile.x = player.x;
    projectile.y = player.y;
    projectile.direction = direction;
    projectile.speed = 10;
    projectile.damage = player.role === "gunner" ? 25 : 15;
    projectile.ownerId = player.id;

    this.state.projectiles.set(projectile.id, projectile);
  }

  private spawnEnemies() {
    if (this.state.enemiesSpawned < this.enemiesPerWave) {
      const enemy = new Enemy();
      enemy.id = `enemy_${Date.now()}_${Math.random()}`;
      enemy.x = Math.random() * 800;
      enemy.y = 0;
      enemy.health = 50 + (this.waveNumber * 10);
      enemy.speed = 1 + (this.waveNumber * 0.2);
      enemy.damage = 10 + (this.waveNumber * 2);
      enemy.type = this.getRandomEnemyType();

      this.state.enemies.set(enemy.id, enemy);
      this.state.enemiesSpawned++;
    }
  }

  private getRandomEnemyType(): string {
    const types = ["basic", "fast", "heavy", "splitter"];
    return types[Math.floor(Math.random() * types.length)];
  }

  private checkCollisions() {
    // Projectile vs Enemy collisions
    this.state.projectiles.forEach((projectile, projId) => {
      this.state.enemies.forEach((enemy, enemyId) => {
        if (this.getDistance(projectile, enemy) < 20) {
          enemy.health -= projectile.damage;
          this.state.projectiles.delete(projId);

          if (enemy.health <= 0) {
            // Award points to team
            const shooter = this.state.players.get(projectile.ownerId);
            if (shooter) {
              shooter.score += 10;
              this.state.teamScore += 10;
            }
            this.state.enemies.delete(enemyId);
          }
        }
      });
    });

    // Enemy vs Player collisions
    this.state.enemies.forEach((enemy, enemyId) => {
      this.state.players.forEach((player, playerId) => {
        if (this.getDistance(enemy, player) < 25) {
          player.health -= enemy.damage;
          if (player.health <= 0) {
            player.health = 0;
            // Respawn logic can be added here
          }
        }
      });
    });
  }

  private getDistance(obj1: any, obj2: any): number {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private nextWave() {
    this.waveNumber++;
    this.enemiesPerWave += 2;
    this.state.enemiesSpawned = 0;
    this.state.waveNumber = this.waveNumber;
    this.state.teamScore += 50; // Wave completion bonus

    this.broadcast("waveComplete", { 
      wave: this.waveNumber, 
      teamScore: this.state.teamScore 
    });
  }
}