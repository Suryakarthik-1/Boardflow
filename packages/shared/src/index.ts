import { z } from "zod";

/**
 * Shared contracts between the Boardflow client and server.
 *
 * These types describe the *wire protocol* — what the browser sends to the
 * server and what the AI returns — rather than tldraw's internal shape
 * schema. The AI works on a deliberately small, stable projection of the
 * canvas (`CanvasObject`) so we control exactly what leaves the browser.
 */

// ---------------------------------------------------------------------------
// Roles & rooms
// ---------------------------------------------------------------------------

export const ROLE = z.enum(["viewer", "editor", "admin"]);
export type Role = z.infer<typeof ROLE>;

export const RoomMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
});
export type RoomMeta = z.infer<typeof RoomMetaSchema>;

export const CreateRoomRequestSchema = z.object({
  name: z.string().min(1).max(200),
  guestName: z.string().min(1).max(80),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const CreateRoomResponseSchema = z.object({
  room: RoomMetaSchema,
  /** Share link the creator hands out to others. */
  shareToken: z.string(),
  /** Per-user role granted by this token. */
  role: ROLE,
});
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

// ---------------------------------------------------------------------------
// Presence (broadcast over Yjs awareness, not stored)
// ---------------------------------------------------------------------------

export const PresenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  cursor: z.object({ x: z.number(), y: z.number() }).optional(),
  selection: z.array(z.string()).optional(),
});
export type Presence = z.infer<typeof PresenceSchema>;

// ---------------------------------------------------------------------------
// The canvas, as the AI sees it
// ---------------------------------------------------------------------------

export const CanvasObjectSchema = z.object({
  id: z.string(),
  /** tldraw shape type, e.g. "note", "text", "geo", "arrow", "frame". */
  type: z.string(),
  text: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  /** Present on arrows/lines: source and target shape ids. */
  from: z.string().optional(),
  to: z.string().optional(),
  /** Edge label, when an arrow carries text. */
  label: z.string().optional(),
});
export type CanvasObject = z.infer<typeof CanvasObjectSchema>;

export const CanvasSchema = z.object({
  objects: z.array(CanvasObjectSchema),
});
export type Canvas = z.infer<typeof CanvasSchema>;

// ---------------------------------------------------------------------------
// AI features
// ---------------------------------------------------------------------------

export const AI_FEATURE = z.enum([
  "roadmap",
  "explain",
  "generate",
  "summary",
  "tasks",
]);
export type AIFeature = z.infer<typeof AI_FEATURE>;

export const AIRequestSchema = z.object({
  feature: AI_FEATURE,
  /** Free-text instruction, used by `generate`. */
  prompt: z.string().optional(),
  canvas: CanvasSchema,
  /** Ids the user has selected, so AI can focus on a subset. */
  selection: z.array(z.string()).optional(),
});
export type AIRequest = z.infer<typeof AIRequestSchema>;

/**
 * `generate` asks the AI to produce *new* canvas objects and links. These
 * are inserted into the same Yjs document as everything else, so they sync
 * and converge like any other edit.
 */
export const GeneratedNodeSchema = z.object({
  type: z.enum(["note", "text", "geo"]),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
export type GeneratedNode = z.infer<typeof GeneratedNodeSchema>;

export const GeneratedEdgeSchema = z.object({
  from: z.number(),
  to: z.number(),
  label: z.string().optional(),
});
export type GeneratedEdge = z.infer<typeof GeneratedEdgeSchema>;

export const RoadmapResultSchema = z.object({
  feature: z.literal("roadmap"),
  title: z.string(),
  phases: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      /** Source object ids this phase was derived from. */
      itemIds: z.array(z.string()),
    }),
  ),
});
export type RoadmapResult = z.infer<typeof RoadmapResultSchema>;

export const ExplainResultSchema = z.object({
  feature: z.literal("explain"),
  markdown: z.string(),
});
export type ExplainResult = z.infer<typeof ExplainResultSchema>;

export const GenerateResultSchema = z.object({
  feature: z.literal("generate"),
  nodes: z.array(GeneratedNodeSchema),
  edges: z.array(GeneratedEdgeSchema),
});
export type GenerateResult = z.infer<typeof GenerateResultSchema>;

export const SummaryResultSchema = z.object({
  feature: z.literal("summary"),
  markdown: z.string(),
});
export type SummaryResult = z.infer<typeof SummaryResultSchema>;

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const TasksResultSchema = z.object({
  feature: z.literal("tasks"),
  tasks: z.array(TaskSchema),
});
export type TasksResult = z.infer<typeof TasksResultSchema>;

export const AIResultSchema = z.discriminatedUnion("feature", [
  RoadmapResultSchema,
  ExplainResultSchema,
  GenerateResultSchema,
  SummaryResultSchema,
  TasksResultSchema,
]);
export type AIResult = z.infer<typeof AIResultSchema>;

// ---------------------------------------------------------------------------
// Versions / snapshots
// ---------------------------------------------------------------------------

export const SnapshotSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  createdAt: z.string(),
  label: z.string().optional(),
  /** Number of canvas objects captured, shown in the version picker. */
  objectCount: z.number(),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

export const SnapshotCreateRequestSchema = z.object({
  label: z.string().min(1).max(200).optional(),
});
export type SnapshotCreateRequest = z.infer<typeof SnapshotCreateRequestSchema>;
