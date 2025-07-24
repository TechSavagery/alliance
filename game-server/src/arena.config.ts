import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

/**
 * Import your Room files
 */
import { GameLobbyRoom } from "./rooms/GameLobbyRoom";
import { ShooterGameRoom } from "./rooms/ShooterGameRoom";

export default Arena({
    getId: () => "Alliance Team Building Platform",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('lobby', GameLobbyRoom);
        gameServer.define('shooter_game', ShooterGameRoom);
        
        // Future game rooms can be added here:
        // gameServer.define('puzzle_game', PuzzleGameRoom);
        // gameServer.define('strategy_game', StrategyGameRoom);
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get("/hello_world", (req, res) => {
            res.send("Alliance Platform - Team Building Games");
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in production)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground);
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-monitor-panel
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
        console.log("🎮 Alliance Team Building Platform starting...");
        console.log("🏢 Lobby room ready for team formation");
        console.log("🔫 Shooter game ready for action");
    }
});