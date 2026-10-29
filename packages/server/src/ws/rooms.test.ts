import { describe, it, expect } from "vitest";
import { Doc, encodeStateAsUpdate } from "yjs";
import { InMemoryPersistence } from "../store/persistence.js";
import { RoomManager } from "./rooms.js";

describe("RoomManager", () => {
  it("creates a room and authenticates its share token", async () => {
    const rooms = new RoomManager(new InMemoryPersistence());
    const room = await rooms.createRoom("My board", "guest");

    expect(await rooms.authenticate(room.id, room.shareToken)).toBe("editor");
    expect(await rooms.authenticate(room.id, "wrong-token")).toBeNull();
    expect(await rooms.authenticate("missing", room.shareToken)).toBeNull();
  });

  it("replays the persisted update log when a room is loaded cold", async () => {
    const persistence = new InMemoryPersistence();
    const rooms = new RoomManager(persistence);
    const created = await rooms.createRoom("Cold load", "guest");

    // Persist one Yjs update out-of-band, as if it arrived from another
    // process or before a restart.
    const doc = new Doc();
    doc.getText("note").insert(0, "hello");
    await persistence.appendUpdate(created.id, encodeStateAsUpdate(doc));

    // Load through a fresh manager (simulating a server restart).
    const cold = new RoomManager(persistence);
    const room = await cold.getRoom(created.id);
    expect(room).not.toBeNull();
    expect(room!.doc.getText("note").toString()).toBe("hello");
  });

  it("captures and lists a snapshot", async () => {
    const rooms = new RoomManager(new InMemoryPersistence());
    const room = await rooms.createRoom("Snapshots", "guest");

    const snapshot = await rooms.createSnapshot(room.id, "v1");
    expect(snapshot).toMatchObject({ roomId: room.id, label: "v1" });
    expect(await rooms.listSnapshots(room.id)).toHaveLength(1);

    const bytes = await rooms.loadSnapshot(snapshot!.id);
    expect(bytes).toBeInstanceOf(Uint8Array);
  });
});
