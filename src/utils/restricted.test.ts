import { describe, expect, it } from "vitest";
import { isRestrictedUrl } from "./restricted";

describe("isRestrictedUrl", () => {
  it("blocks browser and store pages", () => {
    expect(isRestrictedUrl("chrome://extensions")).toBe(true);
    expect(isRestrictedUrl("brave://settings")).toBe(true);
    expect(isRestrictedUrl("edge://flags")).toBe(true);
    expect(isRestrictedUrl("https://chromewebstore.google.com/detail/x")).toBe(true);
    expect(isRestrictedUrl("https://chrome.google.com/webstore/detail/x")).toBe(true);
  });

  it("allows ordinary websites", () => {
    expect(isRestrictedUrl("https://docs.oracle.com/javase/tutorial/")).toBe(false);
    expect(isRestrictedUrl("http://localhost:3000/lesson")).toBe(false);
  });
});
