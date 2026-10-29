# Boardflow

<p align="center">
  <img alt="Node ≥20" src="https://img.shields.io/badge/node-%3E%3D20-brightgreen">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-5.7-blue">
  <img alt="status" src="https://img.shields.io/badge/status-in%20development-orange">
</p>

An AI collaborative creation platform — a shared canvas for docs, diagrams and
visual planning that keeps working through bad connections, and an AI that
reasons over the *actual objects* on your board rather than a screenshot of it.

Built as an end-to-end showcase of distributed-systems thinking: CRDT
synchronization, offline-first editing, multiplayer presence, version history,
and schema-validated AI features.

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Try multiplayer in 30 seconds](#try-multiplayer-in-30-seconds)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Synchronization](#synchronization)
- [Storage & scale-out](#storage--scale-out)
- [AI pipeline](#ai-pipeline)
- [Design decisions](#design-decisions)
- [Tech stack](#tech-stack)
- [Configuration](#configuration)
- [Status](#status)
- [Contributing](#contributing)

## Features

### Collaboration

- **Infinite canvas** (tldraw) with structured objects: notes, text, shapes,
  arrows, frames.
- **CRDT sync** (Yjs) — every edit converges deterministically; no
  last-write-wins, so no work is ever silently lost.
- **Offline-first** — edits apply locally and replay on reconnect
  (`y-indexeddb`).
- **Multiplayer presence** — live cursors, selections and names via the Yjs
  awareness protocol.
- **Share links + guest names** — no account, no setup; the link carries the
  role (`viewer` / `editor`).
- **Version history** — named snapshots you can browse and restore.

### AI (works on the canvas, not a screenshot)

All five features share one pipeline: `canvas → prompt → LLM → zod-validated result`.

| Feature | What it does |
| --- | --- |
| `roadmap` | Turns sticky notes into a phased roadmap. |
| `explain` | Explains a diagram in technical prose. |
| `generate` | Creates new nodes/links from a prompt. |
| `summary` | Summarizes the whole canvas. |
| `tasks` | Extracts implementation tasks from the board. |

## Quick start

> Requires Node ≥ 20.

```bash
npm install
cp .env.example packages/server/.env   # optional; runs in "mock" mode without it

# Dev (client + server together)
npm run dev
```

The landing page runs at `http://localhost:5173` and the API at
`http://localhost:8080`.

```bash
npm run build        # build all workspaces
npm run typecheck    # tsc --noEmit across all workspaces
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end (Playwright; needs `npx playwright install` once)
```

## Try multiplayer in 30 seconds

1. `npm install && npm run dev`
2. Open `http://localhost:5173` and click the primary CTA to create a board.
3. Copy the `/canvas/<roomId>?token=…` URL into a second tab (or incognito
   window) and join as a different guest.
4. Draw in one window — it converges into the other. Toggle offline in devtools
   and keep editing; the changes replay on reconnect.

## Architecture

```
packages/
  shared/   Zod contracts for the wire protocol (rooms, presence, canvas, AI).
  server/   Fastify API + raw WebSocket sync server + AI orchestration.
  client/   React + tldraw canvas, plus the marketing landing page.
```

## Repository layout

```
packages/
  shared/
    src/index.ts              # every zod wire contract (source of truth)
  server/
    src/
      index.ts                # Fastify entry
      config.ts               # zod-validated env at boot
      ws/
        sync-server.ts        # raw WebSocket y-protocols server
        rooms.ts              # RoomManager: live docs + durable update log
      store/
        persistence.ts        # InMemory / Mongo persistence
        pubsub.ts             # InMemory / Redis pub/sub
      ai/
        orchestrator.ts       # feature prompts + zod validation
        provider.ts           # deepseek / openai / mock LLM
  client/
    src/
      sync/
        bindStoreToYjs.ts     # tldraw store ↔ Yjs binding
        connectRoom.ts        # IndexedDB → reconcile → live binding → WS
        useRoomSync.ts        # React hook
      Editor.tsx              # the collaborative canvas
      landing/                # marketing page
```

## Synchronization

The server speaks the [y-protocols](https://github.com/yjs/y-protocols) wire
format over WebSockets:

1. A client connects to `/ws?room=…&token=…&name=…`; the share token is
   authenticated **before** the upgrade completes.
2. A symmetric sync handshake (`sync step 1/2`) exchanges state vectors so both
   sides converge, even when a client reconnects with offline edits.
3. Every document change is (a) broadcast to the room's other sockets, and
   (b) appended to a durable **update log**.
4. Any fresh client — or a restarted server — rebuilds the document by replaying
   that log in order.

The client binding (`bindStoreToYjs`) maps the tldraw store onto a Y.Map of
document-scoped records, so concurrent edits to different shapes merge as a
CRDT instead of overwriting each other. `session` (camera, selection) and
`presence` (cursors) are per-user and intentionally excluded from the synced
document.

## Storage & scale-out

The persistence and pub/sub layers are interfaces with two implementations each,
selected by env var — so the app runs locally with **zero credentials** and
scales to managed infra with no code changes:

| Seam | Local (default) | Production |
| --- | --- | --- |
| Persistence | `InMemoryPersistence` | `MongoPersistence` (MongoDB Atlas) |
| Pub/Sub | `InMemoryPubSub` | `RedisPubSub` (Upstash Redis) |

Redis pub/sub fans each edit out to every server instance, so clients on
different instances see each other.

## AI pipeline

```
AIRequest ──► buildPrompt ──► LLMProvider.complete ──► extractJSON ──► AIResultSchema.parse
```

- `LLMProvider` is pluggable: `deepseek` (OpenAI-compatible), `openai`, or a
  deterministic `mock` for local dev and tests.
- Every response is parsed into JSON and validated against a zod
  discriminated union, so a malformed model response fails loudly in the
  server instead of corrupting the canvas.
- AI endpoints are **stateless** — the client sends a canvas snapshot and writes
  the result back through the normal Yjs sync path.

## Design decisions

- **CRDT over OT.** Yjs is a state-based CRDT, so offline edits merge without a
  server-side transform and a restarted server rebuilds state by replaying the
  update log.
- **Schema-first.** Every wire message is a zod contract in `@boardflow/shared`,
  imported as raw TypeScript by both client and server, so the protocol can't
  drift.
- **AI on objects, not pixels.** The model gets a structured snapshot of the
  canvas, and its output is validated before it ever touches the board.
- **In-memory by default.** Every service (storage, pub/sub, LLM, embeddings)
  has a deterministic in-memory fallback, so development needs no credentials.

## Tech stack

- **Client**: React 19, TypeScript, tldraw 3, Yjs, y-indexeddb, y-websocket
- **Server**: Node.js, Fastify, `ws`, Yjs, y-protocols, lib0
- **Data**: MongoDB (Atlas), Redis (Upstash) — both optional for local dev
- **AI**: DeepSeek / OpenAI (OpenAI-compatible), pluggable mock
- **Testing**: Vitest, Playwright
- **Tooling**: npm workspaces, TypeScript, Vite, tsx

## Configuration

All server configuration is validated with zod at boot (see
`packages/server/src/config.ts`), so a typo fails loudly. Copy `.env.example` to
`packages/server/.env` to override the defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | API / WebSocket port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin |
| `MONGODB_URI` | *(empty → in-memory)* | Durable storage (MongoDB Atlas) |
| `REDIS_URL` | *(empty → in-process)* | Multi-instance pub/sub fan-out |
| `AI_PROVIDER` | `mock` | `deepseek` \| `openai` \| `mock` |
| `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` | *(empty)* | LLM credentials |

## Status

| Area | Status |
| --- | --- |
| Shared contracts, server (rooms, sync, presence, persistence, pub/sub, AI) | ✅ |
| tldraw ↔ Yjs binding (multiplayer + offline in the client) | ✅ |
| Version history / snapshots | ✅ |
| Landing page (Cadvel-style design system) | ✅ |
| Unit + e2e test suite | ✅ |
| Comments / selections UI | 🧭 planned |
| Embeddings + vector search | 🧭 planned |
| Deploy | 🧭 planned |

## Contributing

Pull requests are welcome. This is a monorepo — keep shared wire contracts in
`packages/shared` and prefer adding a unit test alongside any change
(`packages/*/src/**/*.test.ts`, run with `npm test`).
