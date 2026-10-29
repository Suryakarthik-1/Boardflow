# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Boardflow — an AI collaborative creation platform: a shared tldraw canvas with
CRDT sync (Yjs), offline-first editing, multiplayer presence, version history,
and AI features that reason over the actual canvas objects rather than a
screenshot. Requires Node ≥ 20.

## Commands

```bash
npm install          # install all workspaces
npm run dev          # client (Vite :5173) + server (tsx :8080) together
npm run build        # build all workspaces
npm run typecheck    # tsc --noEmit across all workspaces
npm test             # vitest run (unit tests only)
npm run test:watch   # vitest watch mode
npm run test:e2e     # Playwright (needs `npx playwright install` once)
```

- Single test: `npx vitest run packages/server/src/ws/rooms.test.ts` (any file or pattern works).
- Unit tests are restricted to `packages/*/src/**/*.test.ts` (see `vitest.config.ts`); Playwright specs live in `e2e/` and run separately.
- The server runs with zero credentials: leave the Mongo/Redis/AI env vars empty and it falls back to in-memory stores and an `AI_PROVIDER=mock`. Copy `.env.example` to `packages/server/.env` to override.

## Architecture

Monorepo via npm workspaces with three packages:

- `packages/shared` — **the source of truth for the wire protocol.** All zod
  contracts (rooms, presence, the `CanvasObject` projection, AI results,
  snapshots) live in `src/index.ts`. It exports raw `.ts` (no build step), and
  both client and server import it as `@boardflow/shared`.
- `packages/server` — Fastify REST API + a raw `ws` sync server + AI
  orchestration. ESM (`"type": "module"`); relative imports use explicit `.js`
  extensions.
- `packages/client` — React 19 + tldraw canvas (`/canvas/<roomId>`, code-split)
  and the marketing landing page (default route).

### Synchronization

The sync server (`packages/server/src/ws/sync-server.ts`) speaks the
[y-protocols](https://github.com/yjs/y-protocols) wire format over WebSockets at
`/ws?room=…&token=…&name=…`. The share token is authenticated **before** the
WebSocket upgrade completes. A symmetric sync handshake exchanges state vectors
so both directions converge. Every document change is (a) broadcast to the
room's other sockets and (b) appended to a durable update log; a fresh client or
a restarted server rebuilds the document by replaying that log in order.

`RoomManager` (`ws/rooms.ts`) owns live rooms — metadata plus an in-memory Yjs
`Doc` — and attaches the `doc.on("update")` hook that appends every change to
persistence.

### Storage & pub/sub — two implementations, env-selected

Persistence (`store/persistence.ts`) and pub/sub (`store/pubsub.ts`) each define
an interface with an in-memory and a managed implementation, selected by env:

| Seam | Local (default) | Production |
| --- | --- | --- |
| Persistence | `InMemoryPersistence` | `MongoPersistence` (`MONGODB_URI`) |
| Pub/Sub | `InMemoryPubSub` | `RedisPubSub` (`REDIS_URL`) |

Redis pub/sub fans each edit out to other server instances. The `PUBSUB_ORIGIN`
symbol in the sync server breaks the re-publish loop: edits received via pub/sub
are applied locally but not re-published.

### AI pipeline

```
AIRequest → buildPrompt → LLMProvider.complete → extractJSON → AIResultSchema.parse
```

`LLMProvider` (`ai/provider.ts`) is pluggable: `deepseek` / `openai` (both
OpenAI-compatible) or a deterministic `mock` for dev/tests. `ai/orchestrator.ts`
builds the feature-specific prompt and validates the response against the zod
discriminated union in `@boardflow/shared`; a malformed model response fails
loudly on the server. AI endpoints are stateless — the client sends a canvas
snapshot and writes the result back through the normal Yjs sync path.

### Config

`packages/server/src/config.ts` validates all env vars with zod at boot, so a
typo in `.env` fails loudly. Every service has an in-memory fallback.

## Status / notable gaps

- The **tldraw ↔ Yjs binding is not implemented yet**: `packages/client/src/Editor.tsx`
  renders a bare `<Tldraw />`. The server-side pieces (sync, presence,
  persistence, pub/sub, snapshots, AI) are complete; wiring the client store to
  Yjs for multiplayer + offline is the next slice.
- Embeddings / vector search is scaffolded in config but not implemented.
