import type { AIFeature, Canvas } from "@boardflow/shared";
import type { Config } from "../config.js";

/**
 * The LLM is provider-agnostic so the app runs with a deterministic `mock`
 * provider (no key, no network) during development, and a real model in
 * production. DeepSeek exposes an OpenAI-compatible chat API, so one client
 * implementation covers both.
 */

export interface CompletionInput {
  feature: AIFeature;
  system: string;
  user: string;
  /** Typed canvas, used by the mock to produce deterministic results. */
  canvas: Canvas;
}

export interface LLMProvider {
  readonly name: string;
  complete(input: CompletionInput): Promise<string>;
}

export function createLLMProvider(config: Config): LLMProvider {
  switch (config.AI_PROVIDER) {
    case "deepseek":
      return new OpenAICompatibleProvider({
        name: "deepseek",
        baseUrl: config.DEEPSEEK_BASE_URL,
        apiKey: config.DEEPSEEK_API_KEY ?? "",
        model: config.DEEPSEEK_MODEL,
      });
    case "openai":
      return new OpenAICompatibleProvider({
        name: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: config.OPENAI_API_KEY ?? "",
        model: config.OPENAI_MODEL,
      });
    case "mock":
      return new MockProvider();
  }
}

class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  constructor(
    private readonly opts: {
      name: string;
      baseUrl: string;
      apiKey: string;
      model: string;
    },
  ) {
    this.name = opts.name;
  }

  async complete({ system, user }: CompletionInput): Promise<string> {
    if (!this.opts.apiKey) {
      throw new Error(`missing API key for LLM provider "${this.opts.name}"`);
    }
    const res = await fetch(`${this.opts.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opts.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // Ask for JSON so the response is machine-parseable (DeepSeek supports
        // this in JSON mode, as does OpenAI).
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM request failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message.content ?? "";
  }
}

/** Deterministic provider for local development and tests — no key needed. */
class MockProvider implements LLMProvider {
  readonly name = "mock";

  async complete({ feature, canvas }: CompletionInput): Promise<string> {
    const objects = canvas.objects;
    const texts = objects
      .map((o) => o.text?.trim())
      .filter((t): t is string => Boolean(t));

    switch (feature) {
      case "roadmap":
        return JSON.stringify(mockRoadmap(objects));
      case "explain":
        return JSON.stringify({
          feature: "explain",
          markdown: mockExplain(objects),
        });
      case "generate":
        return JSON.stringify({
          feature: "generate",
          nodes: mockGenerate(texts),
          edges: [],
        });
      case "summary":
        return JSON.stringify({
          feature: "summary",
          markdown: texts.length
            ? texts.map((t) => `- ${t}`).join("\n")
            : "This canvas is empty.",
        });
      case "tasks":
        return JSON.stringify({
          feature: "tasks",
          tasks: texts.map((t, i) => ({
            title: t,
            description: "",
            priority: i === 0 ? ("high" as const) : ("medium" as const),
          })),
        });
    }
  }
}

function mockRoadmap(objects: Canvas["objects"]) {
  const withText = objects
    .filter((o) => o.text?.trim())
    .sort((a, b) => a.x - b.x);
  if (withText.length === 0) return { feature: "roadmap", title: "Roadmap", phases: [] };

  // Group left-to-right into phases of ~4 items — a stand-in for the real
  // model's semantic clustering.
  const phases = [];
  for (let i = 0; i < withText.length; i += 4) {
    const items = withText.slice(i, i + 4);
    phases.push({
      title: `Phase ${phases.length + 1}`,
      description: items.map((o) => o.text).join(" · "),
      itemIds: items.map((o) => o.id),
    });
  }
  return { feature: "roadmap", title: "Roadmap", phases };
}

function mockExplain(objects: Canvas["objects"]): string {
  const nodes = objects.filter((o) => !o.from && !o.to);
  const edges = objects.filter((o) => o.from && o.to);
  const lines = [
    `This board has ${nodes.length} objects and ${edges.length} connections.`,
    "",
    ...nodes.map(
      (o) =>
        `- **${o.type}** "${o.text ?? "untitled"}" at (${Math.round(o.x)}, ${Math.round(o.y)})`,
    ),
  ];
  if (edges.length > 0) {
    lines.push("", "Connections:");
    for (const e of edges) {
      lines.push(`- ${e.from} → ${e.to}${e.label ? ` (${e.label})` : ""}`);
    }
  }
  return lines.join("\n");
}

function mockGenerate(texts: string[]) {
  const seed = texts.slice(0, 3);
  return seed.map((text, i) => ({
    type: "note" as const,
    text,
    x: i * 260,
    y: 0,
    w: 240,
    h: 120,
  }));
}
