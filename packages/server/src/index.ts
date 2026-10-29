import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
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
await app.register(cors, {
  origin:
    config.CLIENT_ORIGIN === "*"
      ? true
      : config.CLIENT_ORIGIN.split(",").map((s) => s.trim()),
});

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

// In production / container builds, serve the built Vite client from the same server
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
  path.resolve(__dirname, "../../client/dist"),
  path.resolve(__dirname, "../client/dist"),
  path.resolve(process.cwd(), "packages/client/dist"),
  path.resolve(process.cwd(), "client/dist"),
];
const clientDist = candidatePaths.find((p) => fs.existsSync(p));

if (clientDist) {
  app.log.info({ clientDist }, "serving static client bundle");
  await app.register(fastifyStatic, {
    root: clientDist,
    prefix: "/",
    wildcard: false,
  });

  app.setNotFoundHandler(async (req, reply) => {
    if (req.raw.url?.startsWith("/api") || req.raw.url?.startsWith("/ws")) {
      return reply.code(404).send({ error: "not_found" });
    }
    return reply.sendFile("index.html");
  });
}

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
