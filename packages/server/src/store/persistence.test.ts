import { describe, it, expect } from "vitest";
import { InMemoryPersistence } from "./persistence.js";
import type { StoredRoom } from "./persistence.js";

describe("InMemoryPersistence", () => {
  it("round-trips rooms, updates and snapshots", async () => {
    const p = new InMemoryPersistence();
    await p.connect();

    const room: StoredRoom = {
      id: "r1",
      name: "Test board",
      createdAt: new Date().toISOString(),
      createdBy: "guest",
      shareToken: "tok",
      role: "editor",
    };
    await p.createRoom(room);
    expect(await p.getRoom("r1")).toEqual(room);
    expect(await p.listRooms()).toHaveLength(1);

    await p.appendUpdate("r1", new Uint8Array([1, 2, 3]));
    const updates = await p.loadUpdates("r1");
    expect(Array.from(updates[0]!)).toEqual([1, 2, 3]);

    const snapshot = {
      id: "s1",
      roomId: "r1",
      createdAt: new Date().toISOString(),
      objectCount: 0,
    };
    await p.saveSnapshot(snapshot, new Uint8Array([9, 9]));
    expect(await p.listSnapshots("r1")).toEqual([snapshot]);
    expect(Array.from((await p.loadSnapshot("s1"))!)).toEqual([9, 9]);

    await p.disconnect();
  });

  it("returns empty logs for a room with no updates", async () => {
    const p = new InMemoryPersistence();
    await p.createRoom({
      id: "empty",
      name: "empty",
      createdAt: new Date().toISOString(),
      createdBy: "guest",
      shareToken: "tok",
      role: "viewer",
    });
    expect(await p.loadUpdates("empty")).toEqual([]);
  });
});
