import { describe, it, expect } from "vitest";
import { runAIFeature } from "./orchestrator.js";
import type { LLMProvider } from "./provider.js";

function providerWith(raw: string): LLMProvider {
  return {
    name: "test",
    async complete() {
      return raw;
    },
  };
}

const canvas = {
  objects: [
    { id: "a", type: "note", text: "ship login", x: 0, y: 0, w: 240, h: 120 },
    { id: "b", type: "note", text: "add billing", x: 260, y: 0, w: 240, h: 120 },
  ],
};

describe("runAIFeature", () => {
  it("parses and validates a roadmap result", async () => {
    const raw = JSON.stringify({
      feature: "roadmap",
      title: "Roadmap",
      phases: [{ title: "Phase 1", description: "auth", itemIds: ["a"] }],
    });
    const result = await runAIFeature(providerWith(raw), {
      feature: "roadmap",
      canvas,
    });
    expect(result.feature).toBe("roadmap");
  });

  it("strips code fences around a JSON response", async () => {
    const raw = '```json\n{"feature":"explain","markdown":"# hi"}\n```';
    const result = await runAIFeature(providerWith(raw), {
      feature: "explain",
      canvas,
    });
    expect(result.feature).toBe("explain");
  });

  it("rejects a result whose feature does not match the request", async () => {
    const raw = JSON.stringify({ feature: "summary", markdown: "hi" });
    await expect(
      runAIFeature(providerWith(raw), { feature: "roadmap", canvas }),
    ).rejects.toThrow(/expected "roadmap"/);
  });

  it("rejects malformed model output", async () => {
    await expect(
      runAIFeature(providerWith("not json at all"), { feature: "summary", canvas }),
    ).rejects.toThrow();
  });
});
