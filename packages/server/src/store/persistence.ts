import { MongoClient, Db, Collection, Binary } from "mongodb";
import type { RoomMeta, Role, Snapshot } from "@boardflow/shared";
import type { Config } from "../config.js";

/**
 * A room's durable state = its metadata + a Yjs *update log* + snapshots.
 *
 * Yjs documents are replicated as append-only binary updates. Persisting the
 * log means a fresh client can rebuild any room's document from scratch by
 * applying every update in order. Snapshots are full documents we stash to
 * implement version history / restore without replaying the entire log.
 */

export interface StoredRoom extends RoomMeta {
  shareToken: string;
  role: Role;
}

export interface Persistence {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  createRoom(room: StoredRoom): Promise<void>;
  getRoom(id: string): Promise<StoredRoom | null>;
  listRooms(): Promise<StoredRoom[]>;

  appendUpdate(roomId: string, update: Uint8Array): Promise<void>;
  loadUpdates(roomId: string): Promise<Uint8Array[]>;

  saveSnapshot(snapshot: Snapshot, doc: Uint8Array): Promise<void>;
  listSnapshots(roomId: string): Promise<Snapshot[]>;
  loadSnapshot(snapshotId: string): Promise<Uint8Array | null>;
}

/** In-memory implementation — the local-dev / test default (zero credentials). */
export class InMemoryPersistence implements Persistence {
  private rooms = new Map<string, StoredRoom>();
  private updates = new Map<string, Uint8Array[]>();
  private snapshots = new Map<string, { meta: Snapshot; doc: Uint8Array }>();

  async connect() {}
  async disconnect() {}

  async createRoom(room: StoredRoom) {
    this.rooms.set(room.id, room);
    this.updates.set(room.id, []);
  }

  async getRoom(id: string) {
    return this.rooms.get(id) ?? null;
  }

  async listRooms() {
    return [...this.rooms.values()];
  }

  async appendUpdate(roomId: string, update: Uint8Array) {
    const list = this.updates.get(roomId);
    if (!list) throw new Error(`unknown room: ${roomId}`);
    list.push(update);
  }

  async loadUpdates(roomId: string) {
    return this.updates.get(roomId) ?? [];
  }

  async saveSnapshot(snapshot: Snapshot, doc: Uint8Array) {
    this.snapshots.set(snapshot.id, { meta: snapshot, doc });
  }

  async listSnapshots(roomId: string) {
    return [...this.snapshots.values()]
      .map((s) => s.meta)
      .filter((s) => s.roomId === roomId);
  }

  async loadSnapshot(snapshotId: string) {
    return this.snapshots.get(snapshotId)?.doc ?? null;
  }
}

/**
 * MongoDB Atlas implementation. Wire it via `MONGODB_URI`; otherwise the
 * server uses `InMemoryPersistence`.
 */
export class MongoPersistence implements Persistence {
  private client?: MongoClient;
  private db?: Db;
  private roomsCol?: Collection<StoredRoom>;
  private updatesCol?: Collection<{ roomId: string; seq: number; update: Binary }>;
  private snapshotsCol?: Collection<{ meta: Snapshot; doc: Binary }>;

  constructor(private readonly uri: string, private readonly dbName: string) {}

  async connect() {
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.roomsCol = this.db.collection("rooms");
    this.updatesCol = this.db.collection("updates");
    this.snapshotsCol = this.db.collection("snapshots");

    // `roomId` + `seq` lets us load updates in insertion order and resume
    // a room's log incrementally.
    await this.updatesCol.createIndex({ roomId: 1, seq: 1 });
    await this.snapshotsCol.createIndex({ "meta.roomId": 1 });
  }

  async disconnect() {
    await this.client?.close();
  }

  async createRoom(room: StoredRoom) {
    await this.roomsCol!.insertOne(room);
  }

  async getRoom(id: string) {
    return (await this.roomsCol!.findOne({ id })) ?? null;
  }

  async listRooms() {
    return this.roomsCol!.find({}).toArray();
  }

  async appendUpdate(roomId: string, update: Uint8Array) {
    const last = await this.updatesCol!.findOne(
      { roomId },
      { sort: { seq: -1 } },
    );
    const seq = (last?.seq ?? -1) + 1;
    await this.updatesCol!.insertOne({ roomId, seq, update: toBinary(update) });
  }

  async loadUpdates(roomId: string) {
    const rows = await this.updatesCol!.find({ roomId }).sort({ seq: 1 }).toArray();
    return rows.map((r) => fromBinary(r.update));
  }

  async saveSnapshot(snapshot: Snapshot, doc: Uint8Array) {
    await this.snapshotsCol!.insertOne({ meta: snapshot, doc: toBinary(doc) });
  }

  async listSnapshots(roomId: string) {
    const rows = await this.snapshotsCol!
      .find({ "meta.roomId": roomId })
      .sort({ "meta.createdAt": -1 })
      .toArray();
    return rows.map((r) => r.meta);
  }

  async loadSnapshot(snapshotId: string) {
    const row = await this.snapshotsCol!.findOne({ "meta.id": snapshotId });
    return row ? fromBinary(row.doc) : null;
  }
}

function toBinary(bytes: Uint8Array): Binary {
  return new Binary(Buffer.from(bytes));
}

function fromBinary(binary: Binary): Uint8Array {
  return new Uint8Array(binary.buffer);
}

export function createPersistence(config: Config): Persistence {
  return config.MONGODB_URI
    ? new MongoPersistence(config.MONGODB_URI, config.MONGODB_DB)
    : new InMemoryPersistence();
}
