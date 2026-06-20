export const COLYSEUS_URL =
  process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "http://localhost:2567";

export {
  GAME_HEIGHT,
  GAME_WIDTH,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@alliance/shared";

export type { InputPayload } from "@alliance/shared";
