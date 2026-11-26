import cors from "cors";
import { defineRoom, defineServer } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { createAdminRouter } from "./admin/routes";
import { GameRoom } from "./rooms/GameRoom";
import { SkyRaidRoom } from "./rooms/SkyRaidRoom";

const server = defineServer({
  rooms: {
    // Primary multi-game room names
    arena_room: defineRoom(GameRoom),
    sky_raid_room: defineRoom(SkyRaidRoom),
    // Backward-compatible alias for the original shooter
    game_room: defineRoom(GameRoom),
  },
  express: (app) => {
    app.use(
      cors({
        origin: true,
        credentials: false,
        allowedHeaders: [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Authorization",
          "x-admin-token",
        ],
      })
    );
    app.get("/", (_req, res) => {
      res.send("Alliance multi-game server — ready for takeoff.");
    });
    app.use("/admin/api", createAdminRouter());
    app.use("/colyseus", monitor());
  },
});

export default server;
