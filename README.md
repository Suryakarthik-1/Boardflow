# Boardflow

<p align="center">
  <img alt="Node ≥20" src="https://img.shields.io/badge/node-%3E%3D20-brightgreen">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-5.7-blue">
  <img alt="CRDT" src="https://img.shields.io/badge/sync-Yjs%20CRDT-blueviolet">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

An AI-powered collaborative whiteboard platform built for real-time multiplayer creation, offline-resilient sync, and intelligent canvas reasoning.

Unlike tools that treat AI as a screenshot analyzer, **Boardflow** reasons directly over the *actual structured objects* (shapes, notes, frames, arrows, bindings) on your canvas. Edits converge deterministically via Yjs CRDTs, survive offline drops via IndexedDB, and scale horizontally across multiple instances through Redis pub/sub.

---

## Table of contents

- [Features](#features)
- [Multiplayer & Sync Architecture](#multiplayer--sync-architecture)
- [Try multiplayer in 30 seconds](#try-multiplayer-in-30-seconds)
- [Quick start](#quick-start)
- [Repository layout](#repository-layout)
- [Wire protocol & Shared contracts](#wire-protocol--shared-contracts)
- [API Reference](#api-reference)
  - [Rooms API](#rooms-api)
  - [AI Endpoints](#ai-endpoints)
  - [Snapshots & Version History](#snapshots--version-history)
  - [WebSocket Sync Protocol](#websocket-sync-protocol)
- [AI Engine (Canvas-native reasoning)](#ai-engine-canvas-native-reasoning)
- [Storage & Horizontal Scale-out](#storage--horizontal-scale-out)
- [Key design decisions](#key-design-decisions)
- [Tech stack](#tech-stack)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Status & Roadmap](#status--roadmap)
- [License & Author](#license--author)

---

## Features

### Multiplayer & Collaboration

- **Infinite canvas** powered by **tldraw 3**: sticky notes, rich text, geometric shapes, directional arrows with anchor bindings, and frames.
- **CRDT sync** via **Yjs**: every stroke, movement, and deletion merges deterministically without conflict or data loss. No last-write-wins collisions.
- **Offline-first architecture**: offline edits persist locally in IndexedDB (`y-indexeddb`) and automatically converge with peers upon reconnection.
- **Multiplayer presence**: real-time collaborator cursors, selections, and guest badges using the Yjs awareness protocol.
- **Instant guest access**: no forced sign-ups; share tokens carry roles (`editor`, `viewer`, `admin`) directly inside the URL.
- **Point-in-time snapshots**: named version history with full Yjs update snapshots for backup and instant rollback.

### Canvas-Native AI

Boardflow never sends lossy screenshots to vision models. Instead, it projects the canvas into a structured geometry graph (`CanvasObject` schema) validated through Zod:

| Feature | Description | Output |
| --- | --- | --- |
| `roadmap` | Aggregates sticky notes and tasks into a phased, milestone-driven roadmap. | Structured JSON with milestones, item linkages, and descriptions. |
| `explain` | Analyzes connected system diagrams, flowcharts, or architecture layouts. | Clean, structured Markdown technical explanation. |
| `generate` | Synthesizes ideas into brand new canvas nodes, shapes, and arrow connections. | New nodes and edges inserted directly into the shared CRDT document. |
| `summary` | Generates an executive summary of the entire canvas content and topics. | Structured summary with key bullet points. |
| `tasks` | Scans the board for action items, deliverables, and assignments. | Prioritized task list with dependencies. |

---

## Multiplayer & Sync Architecture

```
                  ┌──────────────────────────────────────────────────┐
                  │                 Browser Client A                 │
                  │  ┌──────────────┐     bindStoreToYjs             │
                  │  │ tldraw store │ ◄──────────────────► Y.Doc     │
                  │  └──────────────┘                       │        │
                  │         ▲                               │        │
                  │   User Strokes                    IndexedDB      │
                  │                                (Offline Cache)   │
                  └─────────┬───────────────────────────────┬────────┘
                            │                               │
                      WebSocket (/ws)                 WebsocketProvider
                            │                               │
                            ▼                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           Fastify Sync Server                          │
  │                                                                        │
  │   1. Authenticate shareToken on WebSocket upgrade                      │
  │   2. Symmetric handshake: exchange state vectors (Sync Step 1 & 2)     │
  │   3. Live broadcast: fan out Yjs updates to room peers                 │
  │   4. Append to durable Update Log (Persistence seam)                   │
  └────────────────────────────┬───────────────────────────────────────────┘
                               │
                      PUBSUB_ORIGIN loop break
                               │
                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   Redis Pub/Sub (Multi-Instance Fan-Out)               │
  │           Enables peers on different server nodes to sync live         │
  └────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │    Browser Client B    │
                  │ (Receives & Converges) │
                  └────────────────────────┘
```

### The tldraw ↔ Yjs Two-Way Binding (`bindStoreToYjs`)

The tldraw store is mapped to a Yjs document structured as:

- `document (Y.Map)`:
  - `store (Y.Map<recordId, TLRecord>)`: contains all document-scoped records (shapes, pages, assets, bindings).
  - `schema (string)`: serialized schema fingerprint to ensure migration safety across clients.
- `session` (camera position, viewport, tool selection) and `presence` (ephemeral cursors) are kept out of durable sync to preserve per-user autonomy.
- **Echo-loop prevention**: local changes filter on `{ source: "user", scope: "document" }`, while remote incoming updates apply via `store.mergeRemoteChanges()`.

---

## Try multiplayer in 30 seconds

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/Suryakarthik-1/Boardflow.git
   cd Boardflow
   npm install
   ```
2. Start both server and client:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser and click **"Start a board"**.
4. Copy the URL (`/canvas/<roomId>?token=…&name=…`) and paste it into a second browser window or an Incognito tab.
5. Draw in one window — watch strokes and sticky notes converge instantly in the second window.
6. Open browser DevTools, switch to **Offline** mode in Network tab, draw a shape, then switch back to **Online** — watch the offline edit replay and merge cleanly.

---

## Quick start

### Prerequisites

- **Node.js**: ≥ 20.0.0
- **npm**: ≥ 10.0.0

```bash
# Clone repository
git clone https://github.com/Suryakarthik-1/Boardflow.git
cd Boardflow

# Install all workspace dependencies
npm install

# (Optional) Configure environment variables; runs in mock mode by default
cp .env.example packages/server/.env

# Launch development environment (Vite client on :5173 + Fastify server on :8080)
npm run dev
```

### Essential CLI Commands

```bash
npm run dev          # Run client and server concurrently with live reload
npm run build        # Build all packages (shared, server, client)
npm run typecheck    # Run tsc --noEmit across all workspaces
npm test             # Run unit test suite via Vitest
npm run test:e2e     # Run Playwright E2E browser tests
```

---

## Repository layout

Monorepo powered by npm workspaces:

```
Boardflow/
├── packages/
│   ├── shared/                       # Wire protocol contracts (Source of Truth)
│   │   └── src/index.ts              # Zod schemas: rooms, presence, canvas, AI, snapshots
│   │
│   ├── server/                       # Fastify API, Sync Server, and AI Orchestration
│   │   ├── src/
│   │   │   ├── index.ts              # Fastify bootstrap + raw ws upgrade handler
│   │   │   ├── config.ts             # Boot-time zod environment validator
│   │   │   ├── routes/
│   │   │   │   ├── rooms.ts          # Room creation & metadata endpoints
│   │   │   │   ├── ai.ts             # Stateless AI pipeline endpoint
│   │   │   │   └── snapshots.ts      # Version history & binary snapshot recovery
│   │   │   ├── ws/
│   │   │   │   ├── sync-server.ts    # y-protocols WebSocket server & token auth
│   │   │   │   └── rooms.ts          # RoomManager: live Y.Doc instances + update logs
│   │   │   ├── store/
│   │   │   │   ├── persistence.ts    # InMemoryPersistence | MongoPersistence
│   │   │   │   └── pubsub.ts         # InMemoryPubSub | RedisPubSub
│   │   │   └── ai/
│   │   │       ├── orchestrator.ts   # Prompt builders & Zod response validators
│   │   │       └── provider.ts       # DeepSeek / OpenAI / Deterministic Mock
│   │
│   └── client/                       # React 19 Frontend + tldraw Canvas
│       ├── src/
│       │   ├── sync/
│       │   │   ├── bindStoreToYjs.ts # tldraw store ↔ Yjs CRDT synchronizer
│       │   │   ├── connectRoom.ts    # IndexedDB → schema reconcile → WS connect
│       │   │   └── useRoomSync.ts    # Lifecycle React hook
│       │   ├── landing/              # Marketing UI with Cadvel design system
│       │   ├── api.ts                # REST client wrappers
│       │   ├── Editor.tsx            # Full-screen collaborative canvas mount
│       │   └── main.tsx              # Router & application entry
```

---

## Wire protocol & Shared contracts

All communication is strictly typed via `@boardflow/shared`. Both client and server import raw TypeScript directly with zero compilation drift.

### The `CanvasObject` Schema

When AI features are triggered, canvas shapes are projected into this schema:

```ts
export const CanvasObjectSchema = z.object({
  id: z.string(),
  type: z.string(),              // "note" | "text" | "geo" | "arrow" | "frame"
  text: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  from: z.string().optional(),   // Arrow origin shape ID
  to: z.string().optional(),     // Arrow target shape ID
  label: z.string().optional(),  // Arrow text label
});
```

---

## API Reference

### Rooms API

| Method | Endpoint | Request Body | Response | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/rooms` | `{ name: string, guestName: string }` | `{ room, shareToken, role }` | Creates a new canvas room with an authentication share token. |
| `GET` | `/api/rooms/:id` | — | `{ id: string, name: string }` | Fetches room metadata. Returns 404 if not found. |

### AI Endpoints

| Method | Endpoint | Request Body | Response | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/rooms/:roomId/ai` | `{ feature, prompt?, canvas, selection? }` | `AIResult` (discriminated union) | Stateless AI feature execution. Result is validated before sending to client. |

### Snapshots & Version History

| Method | Endpoint | Request Body | Response | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/rooms/:roomId/snapshots` | `{ label?: string }` | `SnapshotMeta` | Captures a point-in-time Yjs binary state snapshot. |
| `GET` | `/api/rooms/:roomId/snapshots` | — | `{ snapshots: SnapshotMeta[] }` | Lists all captured snapshots for the room. |
| `GET` | `/api/rooms/:roomId/snapshots/:snapshotId` | — | `application/octet-stream` | Downloads the binary Yjs snapshot for rollback. |

### WebSocket Sync Protocol

- **Endpoint**: `/ws?room=<roomId>&token=<shareToken>&name=<guestName>`
- **Authentication**: Token is verified **before** HTTP upgrade completes; invalid tokens receive `401 Unauthorized`.
- **Wire Format**: Binary messages following `y-protocols/sync` (step 1, step 2, update) and `y-protocols/awareness`.

---

## AI Engine (Canvas-native reasoning)

```
Client Canvas ──► Project to CanvasObject[] ──► HTTP POST /api/rooms/:id/ai
                                                         │
                                                         ▼
                                                buildPrompt(feature)
                                                         │
                                                         ▼
                                                LLMProvider.complete
                                            (DeepSeek / OpenAI / Mock)
                                                         │
                                                         ▼
                                                extractJSON(response)
                                                         │
                                                         ▼
                                                Zod Schema Validation
                                                         │
                                                         ▼
Canvas Editor ◄── Apply Yjs Transaction ◄─────── Validated Result
```

Supported LLM Backends:
- **DeepSeek** (`deepseek-chat`): High performance, cost-effective reasoning.
- **OpenAI** (`gpt-4o-mini`, `gpt-4o`): Standard OpenAI-compatible API.
- **Mock Provider**: Deterministic local generator for zero-cost development and automated testing.

---

## Storage & Horizontal Scale-out

Boardflow is designed to run with **zero external dependencies** out of the box, then transition seamlessly to production infrastructure using environment switches:

| Subsystem | Interface | Local Development (Default) | Production Scale |
| --- | --- | --- | --- |
| **Persistence** | `Persistence` | `InMemoryPersistence` | `MongoPersistence` (MongoDB Atlas) |
| **Pub/Sub** | `PubSub` | `InMemoryPubSub` | `RedisPubSub` (Upstash / Redis) |

In multi-instance setups, Redis pub/sub broadcasts each client update across nodes while breaking re-publish loops using instance-tagged symbols (`PUBSUB_ORIGIN`).

---

## Key design decisions

1. **State-based CRDT (Yjs) over Operational Transformation (OT)**:
   OT requires a central sequencer to resolve concurrent operations. Yjs achieves deterministic eventual consistency without a single point of serialization, making offline sync effortless.
2. **Schema-First Monorepo**:
   Every data contract lives in `packages/shared`. TypeScript compilation errors catch breaking API changes at build time.
3. **Stateless AI with Client-Driven Application**:
   The AI service never mutates the database directly. It acts as an advisory engine returning validated schemas. The client applies the changes as a standard Yjs transaction, ensuring peer sync and undo/redo stacks remain intact.
4. **Resilient Offline IndexedDB Loading**:
   On canvas load, `IndexeddbPersistence.whenSynced` guarantees local state hydration before the WebSocket connection initiates, avoiding state clobbering.

---

## Tech stack

- **Frontend**: React 19, Vite 6, tldraw 3, Yjs, y-indexeddb, y-websocket, TypeScript 5.7
- **Backend**: Node.js 20+, Fastify 5, ws 8, y-protocols, lib0, tsup
- **Databases**: MongoDB Atlas (documents), Upstash Redis (pub/sub)
- **AI Integrations**: DeepSeek API, OpenAI API
- **Testing**: Vitest, Playwright
- **Tooling**: npm workspaces, tsx, ESLint

---

## Configuration

Set environment variables in `packages/server/.env` (see `.env.example`):

```ini
# Server
PORT=8080
CLIENT_ORIGIN=http://localhost:5173

# Storage (Leave empty for in-memory)
MONGODB_URI=mongodb+srv://...
MONGODB_DB=boardflow

# Pub/Sub (Leave empty for in-memory)
REDIS_URL=redis://...

# AI Provider ("deepseek" | "openai" | "mock")
AI_PROVIDER=mock
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

---

## Testing

```bash
# Run all unit tests
npm test

# Run a specific test file
npx vitest run packages/server/src/ws/rooms.test.ts

# Run end-to-end tests
npm run test:e2e
```

---

## Deployment

Boardflow is fully containerized with a multi-stage Docker build that serves both the compiled React frontend and the Fastify WebSocket backend on a single port with zero CORS configuration.

### Deploy on Render (Recommended, Free Tier)

1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New +** → **Blueprint**.
4. Connect `Suryakarthik-1/Boardflow` — Render will detect `render.yaml` automatically.
5. Click **Apply**. Your app will be live at `https://boardflow-xxxx.onrender.com`.

*(Alternatively: **New +** → **Web Service** → Select your repo → Choose **Docker** as the runtime).*

### Deploy on Railway

1. Sign in to [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Boardflow` — Railway reads `Dockerfile` & `railway.json` and deploys automatically.
4. Under the service **Settings** → **Networking**, click **Generate Domain**.

### Deploy via Docker locally or VPS

```bash
# Build the container
docker build -t boardflow .

# Run the container
docker run -p 8080:8080 \
  -e AI_PROVIDER=mock \
  boardflow
```
Visit `http://localhost:8080` to access the production app.

---

## Status & Roadmap

- [x] Shared wire contracts (`@boardflow/shared`)
- [x] Fastify API & WebSocket sync server
- [x] tldraw 3 ↔ Yjs real-time multiplayer binding
- [x] Offline-first synchronization with IndexedDB
- [x] Named snapshot versioning & binary restoration
- [x] Multi-instance scaling via Redis pub/sub
- [x] 5 canvas-native AI features (roadmap, explain, generate, summary, tasks)
- [x] Cadvel-inspired landing page
- [x] One-click cloud deployment (Docker, Render, Railway)
- [ ] In-canvas commenting & thread UI
- [ ] Vector search & semantic canvas embeddings

---

## License & Author

Created by **[Suryakarthik-1](https://github.com/Suryakarthik-1)**.

Released under the **[MIT License](LICENSE)**.
