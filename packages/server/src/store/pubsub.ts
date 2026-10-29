import { EventEmitter } from "node:events";
import Redis from "ioredis";
import type { Config } from "../config.js";

/**
 * Pub/Sub seam for multi-instance fan-out.
 *
 * A single sync-server instance can broadcast Yjs updates to its own sockets
 * directly. To scale horizontally, every instance publishes each update to
 * Redis and subscribes to the channel to re-broadcast to its local sockets —
 * so a client connected to instance A still sees edits from a client on
 * instance B.
 */

export interface PubSub {
  publish(channel: string, message: Uint8Array): Promise<void>;
  subscribe(
    channel: string,
    handler: (message: Uint8Array) => void,
  ): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  close(): Promise<void>;
}

/** In-process implementation — the single-instance / local-dev default. */
export class InMemoryPubSub implements PubSub {
  private emitter = new EventEmitter();

  async publish(channel: string, message: Uint8Array) {
    this.emitter.emit(channel, message);
  }

  async subscribe(
    channel: string,
    handler: (message: Uint8Array) => void,
  ) {
    this.emitter.on(channel, handler);
  }

  async unsubscribe(channel: string) {
    this.emitter.removeAllListeners(channel);
  }

  async close() {
    this.emitter.removeAllListeners();
  }
}

/** Redis (Upstash-compatible, via `ioredis`) implementation. */
export class RedisPubSub implements PubSub {
  private publisher?: Redis;
  private subscriber?: Redis;

  constructor(private readonly url: string) {}

  private ensure() {
    // ioredis needs separate connections for publish and subscribe.
    this.publisher ??= new Redis(this.url);
    this.subscriber ??= new Redis(this.url);
  }

  async publish(channel: string, message: Uint8Array) {
    this.ensure();
    await this.publisher!.publish(channel, Buffer.from(message));
  }

  async subscribe(
    channel: string,
    handler: (message: Uint8Array) => void,
  ) {
    this.ensure();
    await this.subscriber!.subscribe(channel);
    // `messageBuffer` yields raw bytes (not a utf8-decoded string), so binary
    // Yjs updates round-trip without corruption.
    this.subscriber!.on("messageBuffer", (ch, msg) => {
      if (ch.toString() === channel) handler(msg);
    });
  }

  async unsubscribe(channel: string) {
    await this.subscriber?.unsubscribe(channel);
  }

  async close() {
    this.publisher?.disconnect();
    this.subscriber?.disconnect();
  }
}

export function createPubSub(config: Config): PubSub {
  return config.REDIS_URL
    ? new RedisPubSub(config.REDIS_URL)
    : new InMemoryPubSub();
}
