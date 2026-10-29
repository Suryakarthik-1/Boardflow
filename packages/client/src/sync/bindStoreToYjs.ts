import * as Y from "yjs";
import type { TLRecord, TLStore } from "tldraw";

/**
 * Bind a tldraw store to a Yjs document so edits converge across peers.
 *
 * The shared document is laid out as:
 *
 *   document (Y.Map)
 *     store  (Y.Map<recordId, TLRecord>) — one entry per document-scoped record,
 *            so concurrent edits to different records merge as a CRDT rather
 *            than last-write-wins.
 *     schema (string)                     — serialized schema, written once by
 *            the first client and read by everyone to migrate records on load.
 *
 * Only `document`-scoped records (pages, shapes, bindings, assets) are synced.
 * `session` (camera, selection, instance state) and `presence` (cursors) are
 * per-user and intentionally left out.
 */

export const DOCUMENT_KEY = "document";
export const STORE_KEY = "store";
export const SCHEMA_KEY = "schema";

export function bindStoreToYjs(store: TLStore, ydoc: Y.Doc): () => void {
  const document = ydoc.getMap(DOCUMENT_KEY);

  let storeMap = document.get(STORE_KEY) as Y.Map<TLRecord> | undefined;
  if (!storeMap) {
    storeMap = new Y.Map<TLRecord>();
    document.set(STORE_KEY, storeMap);
  }

  // Local edits flow store → Yjs. Only `user`-sourced changes are forwarded:
  // `remote` changes already came from Yjs, so echoing them back would loop.
  const unlistenStore = store.listen(
    (entry) => {
      // `RecordsDiff` keys are `TLRecordId` (a union of id types); widen them to
      // plain strings so they can index the diff and key the Y.Map.
      const added = entry.changes.added as Record<string, TLRecord>;
      const updated = entry.changes.updated as Record<string, [TLRecord, TLRecord]>;
      const removed = entry.changes.removed as Record<string, TLRecord>;
      ydoc.transact(() => {
        for (const [id, record] of Object.entries(added)) storeMap!.set(id, record);
        for (const [id, [, to]] of Object.entries(updated)) storeMap!.set(id, to);
        for (const id of Object.keys(removed)) storeMap!.delete(id);
      });
    },
    { source: "user", scope: "document" },
  );

  // Remote edits flow Yjs → store. `mergeRemoteChanges` marks them `remote` so
  // the listener above ignores them and the change doesn't round-trip.
  const observeStoreMap = (event: Y.YMapEvent<TLRecord>) => {
    const toPut: TLRecord[] = [];
    const toRemove: TLRecord["id"][] = [];
    event.changes.keys.forEach((change, id) => {
      if (change.action === "delete") {
        toRemove.push(id as TLRecord["id"]);
      } else {
        const record = storeMap!.get(id);
        if (record) toPut.push(record);
      }
    });
    if (toPut.length === 0 && toRemove.length === 0) return;

    store.mergeRemoteChanges(() => {
      if (toRemove.length) store.remove(toRemove);
      if (toPut.length) store.put(toPut);
    });
  };
  storeMap.observe(observeStoreMap);

  return () => {
    unlistenStore();
    storeMap!.unobserve(observeStoreMap);
  };
}
