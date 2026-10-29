import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import {
  createTLStore,
  loadSnapshot,
  type TLRecord,
  type TLStore,
  type TLStoreSnapshot,
} from "tldraw";
import {
  bindStoreToYjs,
  DOCUMENT_KEY,
  SCHEMA_KEY,
  STORE_KEY,
} from "./bindStoreToYjs";

export interface RoomSyncOptions {
  roomId: string;
  token: string;
  name: string;
  /** Absolute ws:// or wss:// base URL of the sync server (e.g. `ws://host/ws`). */
  serverUrl: string;
}

export interface RoomSync {
  store: TLStore;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  awareness: WebsocketProvider["awareness"];
  cleanup: () => void;
}

/**
 * Wire a room's Yjs document to a tldraw store, in order:
 *
 * 1. Load any locally persisted edits from IndexedDB (offline-first).
 * 2. Reconcile the store with whatever the document already holds.
 * 3. Bind live sync in both directions.
 * 4. Connect to the sync server (token is authenticated server-side before the
 *    WebSocket upgrade completes).
 */
export async function connectRoomSync(opts: RoomSyncOptions): Promise<RoomSync> {
  const { roomId, token, name, serverUrl } = opts;

  const ydoc = new Y.Doc();

  const indexeddb = new IndexeddbPersistence(`boardflow:${roomId}`, ydoc);
  await indexeddb.whenSynced;

  const store = createTLStore();
  reconcile(store, ydoc);

  const unbind = bindStoreToYjs(store, ydoc);

  const provider = new WebsocketProvider(serverUrl, roomId, ydoc, {
    params: { room: roomId, token, name },
    connect: true,
  });

  // Advertise this user via the awareness protocol (broadcast by the server);
  // cursor/selection updates are layered on later.
  provider.awareness.setLocalState({
    id: presenceId(),
    name,
    color: presenceColor(name),
  });

  return {
    store,
    ydoc,
    provider,
    awareness: provider.awareness,
    cleanup: () => {
      unbind();
      provider.destroy();
      indexeddb.destroy();
      ydoc.destroy();
    },
  };
}

/**
 * One-time setup before live binding: seed the schema if we are the first
 * client, and load any records the document already holds into the (empty)
 * store so a joining peer sees the existing board rather than creating a
 * duplicate default page.
 */
function reconcile(store: TLStore, ydoc: Y.Doc): void {
  const document = ydoc.getMap(DOCUMENT_KEY);

  let storeMap = document.get(STORE_KEY) as Y.Map<TLRecord> | undefined;
  if (!storeMap) {
    storeMap = new Y.Map<TLRecord>();
    document.set(STORE_KEY, storeMap);
  }

  let schemaStr = document.get(SCHEMA_KEY) as string | undefined;
  if (!schemaStr) {
    // `store.schema.serialize()` is what `getStoreSnapshot` uses internally;
    // `getSnapshot(store)` would throw ("Session state is not ready yet")
    // because this bare store has no Editor-initialized session state yet.
    schemaStr = JSON.stringify(store.schema.serialize());
    document.set(SCHEMA_KEY, schemaStr);
  }

  const records = Object.fromEntries(storeMap.entries()) as TLStoreSnapshot["store"];
  if (Object.keys(records).length === 0) return;

  loadSnapshot(store, {
    store: records,
    schema: JSON.parse(schemaStr) as TLStoreSnapshot["schema"],
  });
}

const PALETTE = [
  "#62D6A0",
  "#3FB98A",
  "#0E5C49",
  "#F5B301",
  "#E4572E",
  "#5B8DEF",
  "#A85BD1",
];

function presenceColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}

/** Stable per-browser id so a user keeps the same presence across reloads. */
function presenceId(): string {
  const KEY = "boardflow:presence:id";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}
