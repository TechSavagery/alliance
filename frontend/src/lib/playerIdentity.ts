const PLAYER_ID_KEY = "alliance.playerId";
const DISPLAY_NAME_KEY = "alliance.displayName";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return createId();
  const existing = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id = createId();
  window.localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Pilot";
  return window.localStorage.getItem(DISPLAY_NAME_KEY) || "Pilot";
}

export function setDisplayName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim().slice(0, 24) || "Pilot");
}

export function getJoinOptions() {
  const gameMode = typeof window !== "undefined" 
    ? window.localStorage.getItem("skyRaid.gameMode") || "coop"
    : "coop";
    
  return {
    playerId: getOrCreatePlayerId(),
    displayName: getDisplayName(),
    gameMode,
  };
}

export function setSkyRaidGameMode(mode: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("skyRaid.gameMode", mode);
}
