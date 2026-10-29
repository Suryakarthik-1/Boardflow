# Boardflow

An AI collaborative creation platform — a shared canvas for docs, diagrams and
visual planning that keeps working through bad connections, and an AI that
reasons over the *actual objects* on your board rather than a screenshot of it.

Built as an end-to-end showcase of distributed-systems thinking: CRDT
synchronization, offline-first editing, multiplayer presence, version history,
and schema-validated AI features.

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

## Architecture

```
packages/
  shared/   Zod contracts for the wire protocol (rooms, presence, canvas, AI).
  server/   Fastify API + raw WebSocket sync server + AI orchestration.
  client/   React + tldraw canvas, plus the marketing landing page.
```

### Synchronization

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

### Storage & scale-out

The persistence and pub/sub layers are interfaces with two implementations each,
selected by env var — so the app runs locally with **zero credentials** and
scales to managed infra with no code changes:

| Seam | Local (default) | Production |
| --- | --- | --- |
| Persistence | `InMemoryPersistence` | `MongoPersistence` (MongoDB Atlas) |
| Pub/Sub | `InMemoryPubSub` | `RedisPubSub` (Upstash Redis) |

Redis pub/sub fans each edit out to every server instance, so clients on
different instances see each other.

### AI pipeline

```
AIRequest ──► buildPrompt ──► LLMProvider.complete ──► extractJSON ──► AIResultSchema.parse
```

- `LLMProvider` is pluggable: `deepseek` (OpenAI-compatible), `openai`, or a
  deterministic `mock` for local dev and tests.
- Every response is parsed into JSON and validated against a zod
  discriminated union, so a malformed model response fails loudly in the
  server instead of corrupting the canvas.

## Tech stack

- **Client**: React 19, TypeScript, tldraw 3, Yjs, y-indexeddb, y-websocket
- **Server**: Node.js, Fastify, `ws`, Yjs, y-protocols, lib0
- **Data**: MongoDB (Atlas), Redis (Upstash) — both optional for local dev
- **AI**: DeepSeek / OpenAI (OpenAI-compatible), pluggable mock
- **Testing**: Vitest, Playwright
- **Tooling**: npm workspaces, TypeScript, Vite, tsx

## Getting started

> Requires Node ≥ 20.

```bash
npm install
cp .env.example packages/server/.env   # optional; runs in "mock" mode without it

# Dev (client + server together)
npm run dev

# Type-check everything
npm run typecheck

# Unit tests
npm test

# End-to-end tests (needs `npx playwright install` once)
npm run test:e2e
```

The landing page runs at `http://localhost:5173` and the API at
`http://localhost:8080`.

## Environment variables

See `.env.example`. Every service falls back to an in-memory implementation, so
`npm run dev` works with no credentials and `AI_PROVIDER=mock`.

## Status

| Area | Status |
| --- | --- |
| Shared contracts, server (rooms, sync, presence, persistence, pub/sub, AI) | ✅ |
| Version history / snapshots | ✅ |
| Landing page (Cadvel-style design system) | ✅ |
| Unit + e2e test suite | ✅ |
| tldraw ↔ Yjs binding (multiplayer + offline in the client) | 🚧 next |
| Comments / selections UI | 🧭 planned |
| Embeddings + vector search | 🧭 planned |
| Deploy | 🧭 planned |
# Boardflow
