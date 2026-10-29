import type { FastifyInstance } from "fastify";
import { AIRequestSchema } from "@boardflow/shared";
import type { LLMProvider } from "../ai/provider.js";
import { runAIFeature } from "../ai/orchestrator.js";

/**
 * Stateless AI endpoints: the client sends a snapshot of the canvas and gets
 * a schema-validated result back. Writing results back into the canvas is the
 * client's job (so the edits flow through the same Yjs sync path as everything
 * else).
 */
export function aiRoutes(provider: LLMProvider) {
  return async (app: FastifyInstance) => {
    app.post("/api/rooms/:roomId/ai", async (req, reply) => {
      const body = AIRequestSchema.parse(req.body);
      try {
        return await runAIFeature(provider, body);
      } catch (err) {
        req.log.error(err, "AI feature failed");
        return reply.code(502).send({ error: "ai_failed" });
      }
    });
  };
}
