import appConfig from "./app.config";

const port = Number(process.env.PORT) || 2567;

appConfig.listen(port);
console.log(`⚔️  Alliance game server listening on ws://localhost:${port}`);
