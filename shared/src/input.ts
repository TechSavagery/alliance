export interface InputPayload {
  left: boolean;
  right: boolean;
  up: boolean;
  shoot: boolean;
}

export const defaultInput = (): InputPayload => ({
  left: false,
  right: false,
  up: false,
  shoot: false,
});
