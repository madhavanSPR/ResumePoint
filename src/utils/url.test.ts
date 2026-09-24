import { describe, expect, it } from "vitest";
import { displayUrl, normalizeUrl, urlsMatch } from "./url";

describe("normalizeUrl", () => {
  it("strips tracking parameters and sorts the rest", () => {
    expect(
      normalizeUrl("https://docs.example.com/java?utm_source=x&v=2&gclid=abc&b=1&a=1"),
    ).toBe("https://docs.example.com/java?a=1&b=1&v=2");
  });

  it("removes trailing slashes except at the origin", () => {
    expect(normalizeUrl("https://example.com/foo/")).toBe("https://example.com/foo");
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("drops in-page fragments but keeps hash routes", () => {
    expect(normalizeUrl("https://example.com/page#constructor-invocation")).toBe(
      "https://example.com/page",
    );
    expect(normalizeUrl("https://spa.example.com/app#/lesson/2")).toBe(
      "https://spa.example.com/app#/lesson/2",
    );
    expect(normalizeUrl("https://spa.example.com/app#!/item")).toBe(
      "https://spa.example.com/app#!/item",
    );
  });

  it("does not treat different paths as the same page", () => {
    expect(
      urlsMatch("https://example.com/java/constructors", "https://example.com/java/collections"),
    ).toBe(false);
  });

  it("matches equivalent URLs after normalization", () => {
    expect(
      urlsMatch(
        "https://example.com/java/?utm_campaign=ad#section",
        "https://example.com/java",
      ),
    ).toBe(true);
  });

  it("shortens URLs for display", () => {
    expect(displayUrl("https://chatgpt.com/?temporary-chat=true")).toBe(
      "chatgpt.com/?temporary-chat=true",
    );
    expect(displayUrl("https://chatgpt.com/c/6ab38ce5-2cdc-83ee-a3cd-ec2d5a1c305c")).toBe(
      "chatgpt.com/c/6ab38ce5-2cdc-83ee-a3cd-ec2d5a1c305c",
    );
  });

  it("prefers exact string equality", () => {
    const url = "https://example.com/a?b=1#/route";
    expect(urlsMatch(url, url)).toBe(true);
  });
});
