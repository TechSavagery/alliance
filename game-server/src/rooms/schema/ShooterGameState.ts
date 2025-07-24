import { Schema, Context, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string = "";
  @type("string") role: string = "gunner"; // gunner, engineer, medic
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") rotation: number = 0;
  @type("number") health: number = 100;
  @type("number") score: number = 0;
  @type("number") lastShotTime: number = 0;
  @type("number") lastHealTime: number = 0;
  @type("number") lastRepairTime: number = 0;

  canShoot(): boolean {
    const cooldown = this.role === "gunner" ? 200 : 500; // gunners shoot faster
    return Date.now() - this.lastShotTime > cooldown;
  }

  canHeal(): boolean {
    return Date.now() - this.lastHealTime > 3000; // 3 second cooldown
  }

  canRepair(): boolean {
    return Date.now() - this.lastRepairTime > 2000; // 2 second cooldown
  }
}

export class Enemy extends Schema {
  @type("string") id: string;
  @type("string") type: string = "basic";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 50;
  @type("number") maxHealth: number = 50;
  @type("number") speed: number = 1;
  @type("number") damage: number = 10;
}

export class Projectile extends Schema {
  @type("string") id: string;
  @type("string") ownerId: string;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") direction: number = 0;
  @type("number") speed: number = 10;
  @type("number") damage: number = 25;
}

export class ShooterGameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Enemy }) enemies = new MapSchema<Enemy>();
  @type({ map: Projectile }) projectiles = new MapSchema<Projectile>();
  
  @type("number") baseHealth: number = 100;
  @type("number") teamScore: number = 0;
  @type("number") waveNumber: number = 1;
  @type("number") enemiesSpawned: number = 0;
  @type("string") gameStatus: string = "playing"; // playing, won, lost, paused
  @type("number") gameTime: number = 0;
}