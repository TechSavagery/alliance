export interface SkyRaidInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
}

export const defaultSkyRaidInput = (): SkyRaidInput => ({
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
});
