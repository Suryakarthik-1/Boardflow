import { z } from "zod";

/**
 * Environment configuration, validated at boot so a typo in `.env` fails
 * loudly instead of surfacing as a mysterious runtime bug.
 *
 * Every service has an in-memory fallback: leave the Mongo/Redis/AI fields
 * empty and the app runs locally with zero credentials.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),

  // Durable storage (MongoDB Atlas). Empty → in-memory store.
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.string().default("boardflow"),

  // Pub/Sub (Upstash Redis) for multi-instance fan-out. Empty → in-process.
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // LLM — provider is pluggable so the app runs with "mock" and no key.
  AI_PROVIDER: z.enum(["deepseek", "openai", "mock"]).default("mock"),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-chat"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  // Embeddings — hosted, OpenAI-compatible endpoint (DeepSeek has none).
  EMBEDDING_PROVIDER: z.enum(["openai-compatible", "mock"]).default("mock"),
  EMBEDDING_BASE_URL: z.string().optional(),
  EMBEDDING_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse(env);
}
