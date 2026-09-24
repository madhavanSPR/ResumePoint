import { describe, expect, it } from "vitest";
import type { ResumeCheckpoint } from "../types/checkpoint";
import { findMatchingCheckpoint, findMatchingTab } from "./matching";

function checkpoint(partial: Partial<ResumeCheckpoint> & Pick<ResumeCheckpoint, "url" | "normalizedUrl">): ResumeCheckpoint {
  return {
    id: "1",
    name: "Page",
    title: "Page",
    scrollX: 0,
    scrollY: 0,
    documentHeight: 1000,
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  };
}

describe("findMatchingCheckpoint", () => {
  const items = [
    checkpoint({
      id: "exact",
      url: "https://example.com/java?ref=1",
      normalizedUrl: "https://example.com/java",
    }),
    checkpoint({
      id: "other",
      url: "https://example.com/python",
      normalizedUrl: "https://example.com/python",
    }),
  ];

  it("returns an exact URL match first", () => {
    expect(findMatchingCheckpoint(items, "https://example.com/java?ref=1")?.id).toBe("exact");
  });

  it("falls back to a normalized match", () => {
    expect(findMatchingCheckpoint(items, "https://example.com/java?utm_source=x")?.id).toBe("exact");
  });

  it("does not match a different path", () => {
    expect(findMatchingCheckpoint(items, "https://example.com/java/extra")).toBeUndefined();
  });
});

describe("findMatchingTab", () => {
  it("prefers an exact tab URL", () => {
    const tabs = [
      { id: 1, url: "https://example.com/a?utm_source=x" },
      { id: 2, url: "https://example.com/a" },
    ];
    expect(findMatchingTab(tabs, "https://example.com/a")?.id).toBe(2);
  });
});
