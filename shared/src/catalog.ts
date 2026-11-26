export type GameTitleId = "arena" | "sky_raid";

export type GameTitle = {
  id: GameTitleId;
  name: string;
  shortName: string;
  description: string;
  roomName: string;
  route: string;
  maxPlayers: number;
  tagline: string;
};

export const GAME_TITLES: GameTitle[] = [
  {
    id: "arena",
    name: "Arena Drift",
    shortName: "Arena",
    description:
      "Free-roam space arena. Fly, shoot, and dogfight across a wrapping starfield.",
    roomName: "arena_room",
    route: "/games/arena",
    maxPlayers: 16,
    tagline: "Original Alliance shooter",
  },
  {
    id: "sky_raid",
    name: "Sky Raid",
    shortName: "Sky Raid",
    description:
      "1942-style vertical scroller. Up to 6 shape-planes share one screen and blast descending shape formations.",
    roomName: "sky_raid_room",
    route: "/games/sky-raid",
    maxPlayers: 6,
    tagline: "Co-op vertical shooter",
  },
];

export function getGameTitle(id: GameTitleId) {
  const title = GAME_TITLES.find((game) => game.id === id);
  if (!title) {
    throw new Error(`Unknown game title: ${id}`);
  }
  return title;
}

export function getGameTitleByRoom(roomName: string) {
  return GAME_TITLES.find((game) => game.roomName === roomName);
}
