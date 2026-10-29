import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { createPersistence } from "./store/persistence.js";
import { RoomManager } from "./ws/rooms.js";
import { SyncServer } from "./ws/sync-server.js";
import { createLLMProvider } from "./ai/provider.js";
import { roomRoutes } from "./routes/rooms.js";
import { aiRoutes } from "./routes/ai.js";
import { snapshotRoutes } from "./routes/snapshots.js";

const config = loadConfig();

const app = Fastify({ logger: true });
await app.register(cors, { origin: config.CLIENT_ORIGIN.split(",") });

const persistence = createPersistence(config);
await persistence.connect();

const rooms = new RoomManager(persistence);
const llm = createLLMProvider(config);

app.get("/health", async () => ({
  ok: true,
  service: "boardflow-server",
  aiProvider: config.AI_PROVIDER,
}));

await app.register(roomRoutes(rooms));
await app.register(aiRoutes(llm));
await app.register(snapshotRoutes(rooms));

await app.listen({ port: config.PORT, host: "0.0.0.0" });

// Attach the WebSocket sync server to the same HTTP server. Doing this after
// `listen` (rather than via a plugin) keeps the raw `ws` upgrade handling —
// and its share-token auth — explicit.
new SyncServer(app.server, rooms);

const shutdown = async () => {
  app.log.info("shutting down");
  await persistence.disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
