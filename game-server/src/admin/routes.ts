import { Router, Request, Response, NextFunction } from "express";
import { matchMaker } from "colyseus";
import type { GameRoom } from "../rooms/GameRoom";
import { getStatsStore } from "../persistence/statsStore";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "alliance-dev";

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

function getRoom(roomId: string): GameRoom | undefined {
  return matchMaker.getLocalRoomById(roomId) as GameRoom | undefined;
}

export function createAdminRouter() {
  const router = Router();

  router.use(requireAdmin);

  router.get("/rooms", async (_req, res) => {
    const rooms = await matchMaker.query({ name: "game_room" });

    const payload = rooms.map((listing) => {
      const room = getRoom(listing.roomId);
      const snapshot = room?.getAdminSnapshot?.() ?? null;

      return {
        roomId: listing.roomId,
        name: listing.name,
        clients: listing.clients,
        locked: listing.locked,
        private: listing.private,
        maxClients: listing.maxClients,
        players: snapshot?.players ?? [],
        bulletCount: snapshot?.bulletCount ?? 0,
      };
    });

    res.json({ rooms: payload, adminTokenHint: "x-admin-token header or ?token=" });
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
      ...room.getAdminSnapshot(),
    });
  });

  router.post("/rooms/:roomId/players/:sessionId/reset-score", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const ok = room.adminResetScore(req.params.sessionId);
    if (!ok) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ ok: true, ...room.getAdminSnapshot() });
  });

  router.post("/rooms/:roomId/reset-scores", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    room.adminResetAllScores();
    res.json({ ok: true, ...room.getAdminSnapshot() });
  });

  router.post("/rooms/:roomId/players/:sessionId/respawn", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const ok = room.adminForceRespawn(req.params.sessionId);
    if (!ok) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ ok: true, ...room.getAdminSnapshot() });
  });

  router.post("/rooms/:roomId/players/:sessionId/kick", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const ok = room.adminKick(req.params.sessionId);
    if (!ok) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    res.json({ ok: true, ...room.getAdminSnapshot() });
  });

  router.get("/stats/summary", (_req, res) => {
    res.json(getStatsStore().getSummary());
  });

  return router;
}
