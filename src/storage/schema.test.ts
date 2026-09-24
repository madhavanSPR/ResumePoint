import { describe, expect, it } from "vitest";
import type { ResumeCheckpoint } from "../types/checkpoint";
import {
  mergeImported,
  parseImportPayload,
  sanitizeStore,
  upsertCheckpoint,
} from "./schema";

function item(id: string, url: string, extra: Partial<ResumeCheckpoint> = {}): ResumeCheckpoint {
  return {
    id,
    name: id,
    title: id,
    url,
    normalizedUrl: url,
    scrollX: 0,
    scrollY: 10,
    documentHeight: 800,
    createdAt: 100,
    updatedAt: 100,
    ...extra,
  };
}

describe("checkpoint schema", () => {
  it("upserts one checkpoint per normalized URL", () => {
    const first = item("a", "https://example.com/java", { scrollY: 100, createdAt: 1 });
    const second = item("b", "https://example.com/java", {
      name: "",
      scrollY: 400,
      updatedAt: 2,
    });
    const result = upsertCheckpoint([first], second);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
    expect(result[0].name).toBe("a");
    expect(result[0].scrollY).toBe(400);
    expect(result[0].createdAt).toBe(1);
  });

  it("rejects malformed import payloads", () => {
    expect(() => parseImportPayload({ hello: true })).toThrow(/checkpoints array/);
    expect(() => parseImportPayload({ version: 1, checkpoints: [{ name: "x" }] })).toThrow(
      /valid checkpoints/,
    );
  });

  it("imports valid checkpoints and merges by URL", () => {
    const incoming = parseImportPayload({
      version: 1,
      checkpoints: [
        {
          name: "Java",
          title: "Java",
          url: "https://example.com/java?utm_source=ad",
          scrollY: 220,
        },
      ],
    });
    expect(incoming[0].normalizedUrl).toBe("https://example.com/java");
    const merged = mergeImported(
      [item("old", "https://example.com/java", { scrollY: 1 })],
      incoming,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].scrollY).toBe(220);
  });

  it("moves an existing checkpoint to a new URL", () => {
    const first = item("chat", "https://chatgpt.com/?temporary-chat=true", {
      scrollY: 40,
      createdAt: 1,
    });
    const moved = item("chat", "https://chatgpt.com/c/6ab38ce5-2cdc-83ee-a3cd-ec2d5a1c305c", {
      name: "Java help",
      scrollY: 900,
      updatedAt: 2,
    });
    const result = upsertCheckpoint([first], moved);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("chat");
    expect(result[0].url).toBe("https://chatgpt.com/c/6ab38ce5-2cdc-83ee-a3cd-ec2d5a1c305c");
    expect(result[0].scrollY).toBe(900);
    expect(result[0].createdAt).toBe(1);
  });

  it("replaces a colliding checkpoint when a save is moved onto its URL", () => {
    const original = item("old", "https://chatgpt.com/?temporary-chat=true");
    const other = item("other", "https://chatgpt.com/c/6ab38ce5-2cdc-83ee-a3cd-ec2d5a1c305c");
    const moved = item("old", "https://chatgpt.com/c/6ab38ce5-2cdc-83ee-a3cd-ec2d5a1c305c", {
      name: "Java help",
    });
    const result = upsertCheckpoint([original, other], moved);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("old");
    expect(result[0].name).toBe("Java help");
  });

  it("keeps the auto-update flag", () => {
    const store = sanitizeStore({
      version: 1,
      checkpoints: [item("chat", "https://example.com/a", { autoUpdate: true })],
    });
    expect(store.checkpoints[0].autoUpdate).toBe(true);
  });

  it("sanitizes a store and drops duplicates", () => {
    const store = sanitizeStore({
      version: 1,
      checkpoints: [
        item("one", "https://example.com/a"),
        item("two", "https://example.com/a"),
        { name: "bad" },
      ],
    });
    expect(store.checkpoints).toHaveLength(1);
    expect(store.version).toBe(1);
  });
});
