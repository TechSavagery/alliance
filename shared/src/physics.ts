import {
  FRICTION,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_SPEED,
  ROTATION_SPEED,
  THRUST,
} from "./constants";
import { InputPayload } from "./input";

export interface SimulatedPlayer {
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
}

export function applyPlayerInput(
  player: SimulatedPlayer,
  input: InputPayload,
  dt: number
) {
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

  wrapPosition(player);
}

export function wrapPosition(
  player: SimulatedPlayer,
  mapWidth = MAP_WIDTH,
  mapHeight = MAP_HEIGHT
) {
  if (player.x < 0) player.x = mapWidth;
  if (player.x > mapWidth) player.x = 0;
  if (player.y < 0) player.y = mapHeight;
  if (player.y > mapHeight) player.y = 0;
}

export function copyPlayerState(source: SimulatedPlayer): SimulatedPlayer {
  return {
    x: source.x,
    y: source.y,
    rotation: source.rotation,
    vx: source.vx,
    vy: source.vy,
  };
}
