import { describe, expect, it } from "vitest";
import type { ResumeCheckpoint } from "../types/checkpoint";
import { filterCheckpoints } from "./search";

function item(name: string, title: string, url: string): ResumeCheckpoint {
  return {
    id: name,
    name,
    title,
    url,
    normalizedUrl: url,
    scrollX: 0,
    scrollY: 0,
    documentHeight: 1,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("filterCheckpoints", () => {
  const items = [
    item("Java Constructors", "Java Constructors - Docs", "https://example.com/java/constructors"),
    item("Java Streams", "Streams", "https://example.com/java/streams"),
    item("Python Functions", "Functions", "https://python.org/functions"),
  ];

  it("matches name, title, and URL", () => {
    expect(filterCheckpoints(items, "Java").map((item) => item.id)).toEqual([
      "Java Constructors",
      "Java Streams",
    ]);
    expect(filterCheckpoints(items, "python.org").map((item) => item.id)).toEqual([
      "Python Functions",
    ]);
    expect(filterCheckpoints(items, "Streams").map((item) => item.id)).toEqual(["Java Streams"]);
  });

  it("returns everything when the query is empty", () => {
    expect(filterCheckpoints(items, "   ")).toHaveLength(3);
  });
});
