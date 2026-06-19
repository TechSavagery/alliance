import cors from "cors";
import { defineRoom, defineServer } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { GameRoom } from "./rooms/GameRoom";

const server = defineServer({
  rooms: {
    game_room: defineRoom(GameRoom),
  },
  express: (app) => {
    app.use(cors());
    app.get("/", (_req, res) => {
      res.send("Alliance game server — ready for takeoff.");
    });
    app.use("/colyseus", monitor());
  },
});

export default server;
