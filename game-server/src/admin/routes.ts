import { Router, Request, Response, NextFunction } from "express";
import { matchMaker } from "colyseus";
import { GAME_TITLES } from "@alliance/shared";
import { getStatsStore } from "../persistence/statsStore";

type AdminCapableRoom = {
  roomId: string;
  clients: { length: number };
  getAdminSnapshot?: () => Record<string, unknown>;
  adminResetScore?: (sessionId: string) => boolean;
  adminResetAllScores?: () => void;
  adminForceRespawn?: (sessionId: string) => boolean;
  adminKick?: (sessionId: string) => boolean;
};

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "alliance-dev";
const ROOM_NAMES = [
  ...GAME_TITLES.map((title) => title.roomName),
  "game_room",
];

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token =
    (req.header("x-admin-token") as string | undefined) ??
    (typeof req.query.token === "string" ? req.query.token : undefined);

  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

function getRoom(roomId: string): AdminCapableRoom | undefined {
  return matchMaker.getLocalRoomById(roomId) as AdminCapableRoom | undefined;
}

export function createAdminRouter() {
  const router = Router();

  router.use(requireAdmin);

  router.get("/games", (_req, res) => {
    res.json({ games: GAME_TITLES });
  });

  router.get("/rooms", async (_req, res) => {
    const listings = (
      await Promise.all(ROOM_NAMES.map((name) => matchMaker.query({ name })))
    ).flat();

    const payload = listings.map((listing) => {
      const room = getRoom(listing.roomId);
      const snapshot = room?.getAdminSnapshot?.() ?? null;

      return {
        roomId: listing.roomId,
        name: listing.name,
        clients: listing.clients,
        locked: listing.locked,
        private: listing.private,
        maxClients: listing.maxClients,
        players: (snapshot as { players?: unknown[] } | null)?.players ?? [],
        bulletCount:
          (snapshot as { bulletCount?: number } | null)?.bulletCount ?? 0,
        enemyCount:
          (snapshot as { enemyCount?: number } | null)?.enemyCount ?? 0,
        wave: (snapshot as { wave?: number } | null)?.wave ?? null,
        matchId: (snapshot as { matchId?: number } | null)?.matchId ?? null,
        gameId: (snapshot as { gameId?: string } | null)?.gameId ?? listing.name,
      };
    });

    res.json({ rooms: payload, games: GAME_TITLES });
  });

  router.get("/rooms/:roomId", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found on this process" });
      return;
    }

    res.json({
      roomId: room.roomId,
      clients: room.clients.length,
      ...room.getAdminSnapshot?.(),
    });
  });

  router.post("/rooms/:roomId/players/:sessionId/reset-score", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room?.adminResetScore) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const ok = room.adminResetScore(req.params.sessionId);
    if (!ok) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ ok: true, ...room.getAdminSnapshot?.() });
  });

  router.post("/rooms/:roomId/reset-scores", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room?.adminResetAllScores) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    room.adminResetAllScores();
    res.json({ ok: true, ...room.getAdminSnapshot?.() });
  });

  router.post("/rooms/:roomId/players/:sessionId/respawn", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room?.adminForceRespawn) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const ok = room.adminForceRespawn(req.params.sessionId);
    if (!ok) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ ok: true, ...room.getAdminSnapshot?.() });
  });

  router.post("/rooms/:roomId/players/:sessionId/kick", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room?.adminKick) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const ok = room.adminKick(req.params.sessionId);
    if (!ok) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ ok: true, ...room.getAdminSnapshot?.() });
  });

  router.get("/stats/summary", (req, res) => {
    const gameId =
      typeof req.query.gameId === "string" ? req.query.gameId : undefined;
    res.json(getStatsStore().getSummary(gameId));
  });

  router.get("/players/:playerId", (req, res) => {
    res.json(getStatsStore().getPlayerHistory(req.params.playerId));
  });

  return router;
}
