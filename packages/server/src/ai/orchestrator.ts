import {
  AIFeature,
  AIRequest,
  AIResult,
  AIResultSchema,
} from "@boardflow/shared";
import type { LLMProvider } from "./provider.js";

/**
 * Turns an AI request into a schema-validated result.
 *
 * 1. Build a feature-specific prompt describing the canvas and the exact JSON
 *    to return.
 * 2. Ask the provider for JSON.
 * 3. Parse and validate with zod — so a malformed model response fails loudly
 *    here instead of corrupting the canvas downstream.
 */
export async function runAIFeature(
  provider: LLMProvider,
  req: AIRequest,
): Promise<AIResult> {
  const { system, user } = buildPrompt(req);
  const raw = await provider.complete({
    feature: req.feature,
    system,
    user,
    canvas: req.canvas,
  });
  return parseResult(req.feature, raw);
}

const CANVAS_DESCRIPTION = `You are given a canvas as a JSON object: { "objects": [{ "id", "type", "text", "x", "y", "w", "h", "from", "to", "label" }] }. "type" is a shape type like "note", "text", "geo", "arrow". "from"/"to" are object ids on arrows.`;

const SYSTEM_PROMPTS: Record<AIFeature, string> = {
  roadmap: `${CANVAS_DESCRIPTION}
Turn the sticky notes and text into a product roadmap. Cluster them into phases.
Respond with ONLY a JSON object of the shape:
{ "feature": "roadmap", "title": string, "phases": [{ "title": string, "description": string, "itemIds": string[] }] }
"itemIds" must reference ids that exist in the canvas.`,

  explain: `${CANVAS_DESCRIPTION}
Explain the diagram in prose for a technical reader: what each object is and how the arrows connect them.
Respond with ONLY a JSON object of the shape:
{ "feature": "explain", "markdown": string }`,

  generate: `${CANVAS_DESCRIPTION}
Create NEW canvas nodes (and optionally links) that answer the user's prompt.
Respond with ONLY a JSON object of the shape:
{ "feature": "generate", "nodes": [{ "type": "note" | "text" | "geo", "text": string, "x": number, "y": number, "w": number, "h": number }], "edges": [{ "from": number, "to": number, "label"?: string }] }
"from"/"to" in edges are indexes into the "nodes" array. Lay nodes out left-to-right without overlapping.`,

  summary: `${CANVAS_DESCRIPTION}
Summarize the entire canvas: its topics, structure, and key ideas.
Respond with ONLY a JSON object of the shape:
{ "feature": "summary", "markdown": string }`,

  tasks: `${CANVAS_DESCRIPTION}
Extract the canvas into concrete implementation tasks.
Respond with ONLY a JSON object of the shape:
{ "feature": "tasks", "tasks": [{ "title": string, "description": string, "estimate"?: string, "priority": "low" | "medium" | "high" }] }`,
};

function buildPrompt(req: AIRequest): { system: string; user: string } {
  const selection =
    req.selection && req.selection.length > 0
      ? `\nThe user has selected these object ids (focus on them if relevant): ${req.selection.join(", ")}`
      : "";
  const prompt = req.prompt ? `\nUser instruction: ${req.prompt}` : "";
  return {
    system: SYSTEM_PROMPTS[req.feature],
    user: `${JSON.stringify(req.canvas)}${selection}${prompt}`,
  };
}

function parseResult(feature: AIFeature, raw: string): AIResult {
  const json = extractJSON(raw);
  const result = AIResultSchema.parse(json);
  if (result.feature !== feature) {
    throw new Error(`AI returned feature "${result.feature}", expected "${feature}"`);
  }
  return result;
}

/** Models sometimes wrap JSON in ``` fences or prose — extract the object. */
function extractJSON(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain a JSON object");
  }
  return JSON.parse(raw.slice(start, end + 1));
}
