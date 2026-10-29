import type { FastifyInstance } from "fastify";
import {
  CreateRoomRequestSchema,
  CreateRoomResponseSchema,
} from "@boardflow/shared";
import type { RoomManager } from "../ws/rooms.js";

/**
 * REST API for shared spaces. A client creates a room and receives a share
 * link; anyone holding that link (with the token) can connect to the room's
 * WebSocket and join the canvas.
 */
export function roomRoutes(rooms: RoomManager) {
  return async (app: FastifyInstance) => {
    app.post("/api/rooms", async (req) => {
      const { name, guestName } = CreateRoomRequestSchema.parse(req.body);
      const room = await rooms.createRoom(name, guestName);
      return CreateRoomResponseSchema.parse({
        room: {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt,
          createdBy: room.createdBy,
        },
        shareToken: room.shareToken,
        role: room.role,
      });
    });

    app.get("/api/rooms/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const room = await rooms.getRoom(id);
      if (!room) return reply.code(404).send({ error: "not_found" });
      return { id: room.id, name: room.name };
    });
  };
}
