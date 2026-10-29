import { describe, it, expect } from "vitest";
import {
  AIResultSchema,
  CreateRoomRequestSchema,
  SnapshotCreateRequestSchema,
} from "./index.js";

describe("shared contracts", () => {
  it("validates a room create request", () => {
    expect(
      CreateRoomRequestSchema.parse({ name: "board", guestName: "Ada" }),
    ).toEqual({ name: "board", guestName: "Ada" });
  });

  it("rejects a room create request missing a name", () => {
    expect(() =>
      CreateRoomRequestSchema.parse({ guestName: "Ada" }),
    ).toThrow();
  });

  it("accepts an optional snapshot label", () => {
    expect(SnapshotCreateRequestSchema.parse({ label: "v1" })).toEqual({
      label: "v1",
    });
  });

  it("accepts a well-formed summary AI result", () => {
    const result = AIResultSchema.parse({ feature: "summary", markdown: "hello" });
    expect(result.feature).toBe("summary");
  });

  it("rejects an AI result missing required fields", () => {
    expect(() =>
      AIResultSchema.parse({ feature: "roadmap", title: "no phases" }),
    ).toThrow();
  });
});
