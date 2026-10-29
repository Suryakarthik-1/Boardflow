import type { Server, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { decoding, encoding } from "lib0";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { Awareness } from "y-protocols/awareness";
import { applyUpdate, type Doc } from "yjs";
import type { RoomManager } from "./rooms.js";
import type { PubSub } from "../store/pubsub.js";

/**
 * The multiplayer sync server.
 *
 * Speaks the y-protocols `sync` (CRDT document) and `awareness` (presence)
 * protocols over a WebSocket. Each connected client joins a room's live Yjs
 * document; the server routes edits between clients and persists the update
 * log via `RoomManager`.
 *
 * The handshake is symmetric so both directions converge: the client sends its
 * state vector, the server replies with the diff the client is missing, and
 * vice-versa. That is what lets an offline client replay its edits on
 * reconnection and end up with the exact same document as everyone else.
 *
 * With a `PubSub` configured, each instance also publishes every edit and
 * applies edits it receives from other instances, so a client on instance A
 * sees edits from a client on instance B. The `PUBSUB_ORIGIN` tag breaks the
 * re-publish loop (an edit received via pub/sub is applied but not re-published).
 */

// Outer protocol framing, matching the y-websocket wire format.
const messageSync = 0;
const messageAwareness = 1;
const messageQueryAwareness = 3;

const PUBSUB_ORIGIN = Symbol("pubsub");

interface ClientSocket extends WebSocket {
  roomId?: string;
  name?: string;
  /** Awareness client IDs owned by this socket (for disconnect cleanup). */
  clientIds: Set<number>;
}

interface RoomSession {
  doc: Doc;
  awareness: Awareness;
  clients: Set<ClientSocket>;
}

export class SyncServer {
  private wss = new WebSocketServer({ noServer: true });
  private sessions = new Map<string, RoomSession>();

  constructor(
    server: Server,
    private readonly rooms: RoomManager,
    private readonly pubsub?: PubSub,
  ) {
    server.on("upgrade", (req, socket, head) => {
      void this.handleUpgrade(req, socket, head);
    });
    this.wss.on("connection", (ws) => {
      void this.handleConnection(ws as ClientSocket);
    });
  }

  /** Authenticate the share token *before* completing the WebSocket upgrade. */
  private async handleUpgrade(
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const roomId = url.searchParams.get("room");
    const token = url.searchParams.get("token");
    const name = url.searchParams.get("name") ?? "Guest";

    if (!roomId || !token || !(await this.rooms.authenticate(roomId, token))) {
      this.reject(socket, 401);
      return;
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      const client = ws as ClientSocket;
      client.roomId = roomId;
      client.name = name;
      client.clientIds = new Set();
      this.wss.emit("connection", client, req);
    });
  }

  private async handleConnection(ws: ClientSocket) {
    const room = await this.rooms.getRoom(ws.roomId!);
    if (!room) {
      ws.close();
      return;
    }

    const session = await this.ensureSession(room.id, room.doc);
    session.clients.add(ws);

    // Ask the client for anything it has that we don't (server → client step1),
    // then send the current presence of everyone already connected.
    ws.send(encodeSyncStep1(room.doc));
    ws.send(encodeAwareness(session.awareness));

    ws.on("message", (data) => this.onMessage(ws, session, toBytes(data)));
    ws.on("close", () => {
      session.clients.delete(ws);
      awarenessProtocol.removeAwarenessStates(
        session.awareness,
        [...ws.clientIds],
        "server",
      );
    });
    ws.on("error", () => ws.close());
  }

  /** Register a room's broadcast handlers once, the first time it's joined. */
  private async ensureSession(roomId: string, doc: Doc): Promise<RoomSession> {
    const existing = this.sessions.get(roomId);
    if (existing) return existing;

    const awareness = new Awareness(doc);
    const session: RoomSession = { doc, awareness, clients: new Set() };
    this.sessions.set(roomId, session);

    // Broadcast document changes to everyone except the client that sent them,
    // and fan them out to other server instances via pub/sub.
    doc.on("update", (update: Uint8Array, origin: unknown) => {
      const msg = encodeSyncUpdate(update);
      for (const client of session.clients) {
        if (client !== origin) client.send(msg);
      }
      if (this.pubsub && origin !== PUBSUB_ORIGIN) {
        void this.pubsub.publish(roomChannel(roomId), update);
      }
    });

    // Broadcast presence changes, and remember which awareness ids belong to
    // which socket so their cursors disappear on disconnect.
    awareness.on(
      "update",
      (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin instanceof WebSocket) {
          const ws = origin as ClientSocket;
          for (const id of added) ws.clientIds.add(id);
          for (const id of updated) ws.clientIds.add(id);
          for (const id of removed) ws.clientIds.delete(id);
        }
        const changed = [...added, ...updated, ...removed];
        if (changed.length === 0) return;
        const msg = encodeAwareness(awareness, changed);
        for (const client of session.clients) {
          if (client !== origin) client.send(msg);
        }
      },
    );

    // Apply edits published by other server instances. `PUBSUB_ORIGIN` ensures
    // they broadcast to our local clients but are not re-published.
    if (this.pubsub) {
      await this.pubsub.subscribe(roomChannel(roomId), (update) => {
        applyUpdate(doc, update, PUBSUB_ORIGIN);
      });
    }

    return session;
  }

  private onMessage(ws: ClientSocket, session: RoomSession, message: Uint8Array) {
    const decoder = decoding.createDecoder(message);
    const encoder = encoding.createEncoder();
    const type = decoding.readVarUint(decoder);

    switch (type) {
      case messageSync: {
        encoding.writeVarUint(encoder, messageSync);
        // Dispatches step1/step2/update internally and replies as needed.
        syncProtocol.readSyncMessage(decoder, encoder, session.doc, ws);
        if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder));
        break;
      }
      case messageQueryAwareness: {
        ws.send(encodeAwareness(session.awareness));
        break;
      }
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          session.awareness,
          decoding.readVarUint8Array(decoder),
          ws,
        );
        break;
      }
      default:
        break;
    }
  }

  private reject(socket: Duplex, code: 401 | 403) {
    const status = code === 401 ? "Unauthorized" : "Forbidden";
    socket.write(`HTTP/1.1 ${code} ${status}\r\n\r\n`);
    socket.destroy();
  }
}

function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

function encodeSyncStep1(doc: Doc): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  return encoding.toUint8Array(encoder);
}

function encodeSyncUpdate(update: Uint8Array): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  return encoding.toUint8Array(encoder);
}

function encodeAwareness(awareness: Awareness, clients?: number[]): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageAwareness);
  const ids = clients ?? [...awareness.getStates().keys()];
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, ids),
  );
  return encoding.toUint8Array(encoder);
}

function toBytes(data: Buffer | ArrayBuffer | Buffer[]): Uint8Array {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  return new Uint8Array(data as ArrayBuffer);
}
