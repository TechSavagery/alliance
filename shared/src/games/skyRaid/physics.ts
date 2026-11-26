import {
  SKY_MAP_HEIGHT,
  SKY_MAP_WIDTH,
  SKY_PLAYER_MAX_Y,
  SKY_PLAYER_MIN_Y,
  SKY_PLAYER_SPEED,
} from "./constants";
import type { SkyRaidInput } from "./input";

export interface SkyRaidPlayerState {
  x: number;
  y: number;
}

export function applySkyRaidInput(
  player: SkyRaidPlayerState,
  input: SkyRaidInput,
  dt: number
) {
  if (input.left) player.x -= SKY_PLAYER_SPEED * dt;
  if (input.right) player.x += SKY_PLAYER_SPEED * dt;
  if (input.up) player.y -= SKY_PLAYER_SPEED * dt;
  if (input.down) player.y += SKY_PLAYER_SPEED * dt;

  player.x = Math.max(20, Math.min(SKY_MAP_WIDTH - 20, player.x));
  player.y = Math.max(
    SKY_PLAYER_MIN_Y,
    Math.min(SKY_PLAYER_MAX_Y, Math.min(SKY_MAP_HEIGHT - 20, player.y))
  );
}
