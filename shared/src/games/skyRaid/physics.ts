import {
  SKY_MAP_HEIGHT,
  SKY_MAP_WIDTH,
  SKY_PLAYER_MAX_Y,
  SKY_PLAYER_MIN_Y,
  SKY_PLAYER_SPEED,
  SKY_POWER_LEVEL_SPEEDS,
} from "./constants";
import type { SkyRaidInput } from "./input";

export interface SkyRaidPlayerState {
  x: number;
  y: number;
  speedLevel?: number;
}

export function applySkyRaidInput(
  player: SkyRaidPlayerState,
  input: SkyRaidInput,
  dt: number
) {
  const speed = player.speedLevel ? (SKY_POWER_LEVEL_SPEEDS[player.speedLevel] ?? SKY_PLAYER_SPEED) : SKY_PLAYER_SPEED;
  
  if (input.left) player.x -= speed * dt;
  if (input.right) player.x += speed * dt;
  if (input.up) player.y -= speed * dt;
  if (input.down) player.y += speed * dt;

  player.x = Math.max(20, Math.min(SKY_MAP_WIDTH - 20, player.x));
  player.y = Math.max(
    SKY_PLAYER_MIN_Y,
    Math.min(SKY_PLAYER_MAX_Y, Math.min(SKY_MAP_HEIGHT - 20, player.y))
  );
}
