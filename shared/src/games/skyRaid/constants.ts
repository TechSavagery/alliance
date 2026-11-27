export const SKY_MAP_WIDTH = 800;
export const SKY_MAP_HEIGHT = 600;
export const SKY_GAME_WIDTH = SKY_MAP_WIDTH;
export const SKY_GAME_HEIGHT = SKY_MAP_HEIGHT;

export const SKY_TICK_RATE = 60;
export const SKY_TICK_MS = 1000 / SKY_TICK_RATE;

export const SKY_MAX_PLAYERS = 6;
export const SKY_PLAYER_SPEED = 4.2;
export const SKY_PLAYER_MIN_Y = 360;
export const SKY_PLAYER_MAX_Y = 560;
export const SKY_FIRE_COOLDOWN_MS = 180;
export const SKY_BULLET_SPEED = 11;
export const SKY_SCROLL_SPEED = 1.6;

export const SKY_PLAYER_HIT_RADIUS = 12;
export const SKY_BULLET_HIT_RADIUS = 3;
export const SKY_ENEMY_HIT_RADIUS = 14;

export const SKY_RESPAWN_MS = 2000;
export const SKY_INVULN_MS = 1500;
export const SKY_ENEMY_SCORE = 50;
export const SKY_WAVE_INTERVAL_MS = 2200;

export const SKY_PLAYER_COLORS = [
  0x7dffb3,
  0x58f5ff,
  0xffd166,
  0xff8fab,
  0xc3a6ff,
  0xff9f1c,
];

export const SKY_INTERPOLATION_FACTOR = 0.25;

export const SKY_POWERUP_DROP_CHANCE = 0.25;
export const SKY_MULTIPLIER_DROP_CHANCE = 0.05;
export const SKY_POWERUP_DRIFT_SPEED = 1.0;
export const SKY_POWERUP_COLLECT_RADIUS = 20;
export const SKY_MULTIPLIER_DURATION_MS = 15000;
export const SKY_MAX_SHIELDS = 3;
export const SKY_MAX_BOMBS = 3;
export const SKY_MAX_POWER_LEVEL = 5;
export const SKY_MAX_SPEED_LEVEL = 4;

export const SKY_POWER_LEVEL_SPEEDS: Record<number, number> = {
  1: 4.2,
  2: 5.0,
  3: 5.8,
  4: 6.6,
};

export const SKY_POWER_LEVEL_COOLDOWNS: Record<number, number> = {
  1: 180,
  2: 170,
  3: 160,
  4: 150,
  5: 140,
};

export const SKY_POWERUP_COLORS = {
  weapon: 0xff9f1c,
  speed: 0x58f5ff,
  shield: 0x7dffb3,
  bomb: 0xff3366,
  multiplier: 0xffd166,
};

export const SKY_REVIVE_RADIUS = 50;
export const SKY_REVIVE_TIME_MS = 2000;
export const SKY_REVIVE_REWARD = 200;
