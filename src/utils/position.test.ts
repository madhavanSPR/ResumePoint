import { describe, expect, it } from "vitest";
import { positionMoved } from "./position";

describe("positionMoved", () => {
  it("ignores tiny scroll noise", () => {
    expect(
      positionMoved({ scrollX: 0, scrollY: 400 }, { scrollX: 0, scrollY: 420 }),
    ).toBe(false);
  });

  it("detects a real move down the page", () => {
    expect(
      positionMoved({ scrollX: 0, scrollY: 400 }, { scrollX: 0, scrollY: 520 }),
    ).toBe(true);
  });

  it("detects a different heading", () => {
    expect(
      positionMoved(
        { scrollX: 0, scrollY: 400, anchorValue: "Constructors" },
        { scrollX: 0, scrollY: 410, anchorValue: "Methods" },
      ),
    ).toBe(true);
  });
});
