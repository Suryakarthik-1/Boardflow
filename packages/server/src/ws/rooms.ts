import { applyUpdate, encodeStateAsUpdate, Doc } from "yjs";
import { nanoid } from "nanoid";
import type { Role, Snapshot } from "@boardflow/shared";
import type { Persistence, StoredRoom } from "../store/persistence.js";

/**
 * A live room = its metadata + an in-memory Yjs document.
 */
export interface Room {
  id: string;
  name: string;
  shareToken: string;
  /** Role granted by `shareToken` (a link can be editor or viewer). */
  role: Role;
  doc: Doc;
}

/**
 * Loads rooms from persistence and holds their live Yjs documents.
 *
 * Every change to a room's document is appended to the durable update log as
 * it happens, so the document can be rebuilt from scratch by any fresh client
 * (or a restarted server) by replaying the log in order.
 */
export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor(private readonly persistence: Persistence) {}

  async createRoom(name: string, createdBy: string): Promise<StoredRoom> {
    const stored: StoredRoom = {
      id: nanoid(12),
      name,
      createdAt: new Date().toISOString(),
      createdBy,
      shareToken: nanoid(32),
      role: "editor",
    };
    await this.persistence.createRoom(stored);
    this.rooms.set(
      stored.id,
      this.wire(stored.id, stored.name, stored.shareToken, stored.role, new Doc()),
    );
    return stored;
  }

  async getRoom(id: string): Promise<Room | null> {
    const cached = this.rooms.get(id);
    if (cached) return cached;

    const stored = await this.persistence.getRoom(id);
    if (!stored) return null;

    // Rebuild the document by replaying the persisted update log.
    const doc = new Doc();
    for (const update of await this.persistence.loadUpdates(id)) {
      applyUpdate(doc, update);
    }

    const room = this.wire(
      stored.id,
      stored.name,
      stored.shareToken,
      stored.role,
      doc,
    );
    this.rooms.set(id, room);
    return room;
  }

  async authenticate(roomId: string, token: string): Promise<Role | null> {
    const room = await this.getRoom(roomId);
    return room && room.shareToken === token ? room.role : null;
  }

  // -------------------------------------------------------------------------
  // Snapshots (version history)
  // -------------------------------------------------------------------------

  /** Capture the room's full document state as a restorable snapshot. */
  async createSnapshot(roomId: string, label?: string): Promise<Snapshot | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const snapshot: Snapshot = {
      id: nanoid(12),
      roomId,
      createdAt: new Date().toISOString(),
      label,
      // Top-level shared types is a rough proxy until the tldraw binding pins
      // down the exact shape map; `objectCount` is cosmetic either way.
      objectCount: room.doc.share.size,
    };
    // `encodeStateAsUpdate` serializes the whole document into a single update
    // that reconstructs it when applied to a fresh doc — exactly what restore
    // needs, and independent of the incremental update log.
    await this.persistence.saveSnapshot(snapshot, encodeStateAsUpdate(room.doc));
    return snapshot;
  }

  async listSnapshots(roomId: string): Promise<Snapshot[]> {
    return this.persistence.listSnapshots(roomId);
  }

  async loadSnapshot(snapshotId: string): Promise<Uint8Array | null> {
    return this.persistence.loadSnapshot(snapshotId);
  }

  /** Attach the persistence hook; the update fires for every change we apply. */
  private wire(
    id: string,
    name: string,
    shareToken: string,
    role: Role,
    doc: Doc,
  ): Room {
    doc.on("update", (update: Uint8Array) => {
      void this.persistence.appendUpdate(id, update);
    });
    return { id, name, shareToken, role, doc };
  }
}
