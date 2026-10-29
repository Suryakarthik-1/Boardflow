import type { FastifyInstance } from "fastify";
import { SnapshotCreateRequestSchema } from "@boardflow/shared";
import type { RoomManager } from "../ws/rooms.js";

/**
 * Version history: capture a room's document at a point in time and restore it
 * later. A snapshot is the full Yjs state encoded as a single update, returned
 * as raw bytes the client applies to a fresh document.
 */
export function snapshotRoutes(rooms: RoomManager) {
  return async (app: FastifyInstance) => {
    app.post("/api/rooms/:roomId/snapshots", async (req, reply) => {
      const { roomId } = req.params as { roomId: string };
      const { label } = SnapshotCreateRequestSchema.parse(req.body ?? {});
      const snapshot = await rooms.createSnapshot(roomId, label);
      if (!snapshot) return reply.code(404).send({ error: "not_found" });
      return snapshot;
    });

    app.get("/api/rooms/:roomId/snapshots", async (req) => {
      const { roomId } = req.params as { roomId: string };
      return { snapshots: await rooms.listSnapshots(roomId) };
    });

    app.get("/api/rooms/:roomId/snapshots/:snapshotId", async (req, reply) => {
      const { snapshotId } = req.params as { snapshotId: string };
      const bytes = await rooms.loadSnapshot(snapshotId);
      if (!bytes) return reply.code(404).send({ error: "not_found" });
      return reply.type("application/octet-stream").send(Buffer.from(bytes));
    });
  };
}
