import { describe, expect, it } from "vitest";
import type { ResumeCheckpoint } from "../types/checkpoint";
import { orderCheckpoints } from "./ordering";

function item(id: string, updatedAt: number, normalizedUrl: string): ResumeCheckpoint {
  return {
    id,
    name: id,
    title: id,
    url: normalizedUrl,
    normalizedUrl,
    scrollX: 0,
    scrollY: 0,
    documentHeight: 1,
    createdAt: 1,
    updatedAt,
  };
}

describe("orderCheckpoints", () => {
  it("pins the current page first and sorts the rest by last updated", () => {
    const items = [
      item("sql", 10, "https://example.com/sql"),
      item("python", 30, "https://example.com/python"),
      item("java", 20, "https://example.com/java"),
    ];

    expect(
      orderCheckpoints(items, "https://example.com/java").map((checkpoint) => checkpoint.id),
    ).toEqual(["java", "python", "sql"]);
  });
});
