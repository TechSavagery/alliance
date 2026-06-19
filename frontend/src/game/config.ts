export const COLYSEUS_URL =
  process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "http://localhost:2567";

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export interface InputPayload {
  left: boolean;
  right: boolean;
  up: boolean;
  shoot: boolean;
}
