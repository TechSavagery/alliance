import { MapSchema, Schema, type } from "@colyseus/schema";

export class SkyRaidPlayer extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") seat: number = 0;
  @type("number") score: number = 0;
  @type("number") kills: number = 0;
  @type("number") deaths: number = 0;
  @type("boolean") alive: boolean = true;
  @type("number") powerLevel: number = 1;
  @type("number") speedLevel: number = 1;
  @type("number") shields: number = 0;
  @type("number") bombs: number = 0;
  @type("number") multiplier: number = 1.0;
  @type("number") multiplierEnds: number = 0;
  @type("number") reviveProgress: number = 0;
  @type("number") revives: number = 0;
}

export class SkyRaidBullet extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("string") ownerId: string = "";
}

export class SkyRaidEnemy extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  /** 0 = circle fighter, 1 = square tank, 2 = diamond bomber */
  @type("number") kind: number = 0;
  @type("number") hp: number = 1;
}

export class SkyRaidPowerUp extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vy: number = 1;
  /** 0 = weapon, 1 = speed, 2 = shield, 3 = bomb, 4 = multiplier */
  @type("number") type: number = 0;
}

export class SkyRaidState extends Schema {
  @type({ map: SkyRaidPlayer }) players = new MapSchema<SkyRaidPlayer>();
  @type({ map: SkyRaidBullet }) bullets = new MapSchema<SkyRaidBullet>();
  @type({ map: SkyRaidEnemy }) enemies = new MapSchema<SkyRaidEnemy>();
  @type({ map: SkyRaidPowerUp }) powerUps = new MapSchema<SkyRaidPowerUp>();
  @type("number") scrollY: number = 0;
  @type("number") wave: number = 1;
  @type("string") gameMode: string = "coop";
  @type("number") sessionTime: number = 0;
  @type("number") nextMilestone: number = 300;
}
