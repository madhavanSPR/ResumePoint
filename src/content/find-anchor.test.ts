import { describe, expect, it } from "vitest";
import { captureAnchor, locateAnchor } from "./find-anchor";

function setRect(element: Element, top: number, height = 24): void {
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: top,
      top,
      left: 0,
      right: 320,
      bottom: top + height,
      width: 320,
      height,
      toJSON() {
        return {};
      },
    }) as DOMRect;
}

describe("anchor capture and locate", () => {
  it("captures the nearest heading and finds it again", () => {
    document.body.innerHTML = `
      <h1 id="constructors">Java Constructors</h1>
      <p>Intro text about classes.</p>
      <h2 id="invocation">Constructor Invocation</h2>
      <p>The this() constructor invocation is used to call another constructor.</p>
    `;

    const h1 = document.querySelector("h1")!;
    const h2 = document.querySelector("h2")!;
    const p = document.querySelectorAll("p")[1]!;
    setRect(h1, -120);
    setRect(h2, 40);
    setRect(document.querySelectorAll("p")[0]!, -40);
    setRect(p, 90);

    const anchor = captureAnchor(document, {
      width: 400,
      height: 400,
      scrollX: 0,
      scrollY: 800,
    });

    expect(anchor?.type).toBe("heading");
    expect(anchor?.value).toContain("Constructor Invocation");
    expect(anchor?.elementId).toBe("invocation");

    const found = locateAnchor(document, anchor!, 800);
    expect(found?.id).toBe("invocation");
  });

  it("does not trust an id unless the text still matches", () => {
    document.body.innerHTML = `
      <h2 id="invocation">A completely different heading</h2>
      <p>Unrelated body copy that should not match the stored heading.</p>
    `;
    const heading = document.querySelector("h2")!;
    const paragraph = document.querySelector("p")!;
    setRect(heading, 20);
    setRect(paragraph, 80);

    const found = locateAnchor(
      document,
      {
        type: "heading",
        value: "Constructor Invocation",
        elementId: "invocation",
        tagName: "h2",
      },
      0,
    );

    expect(found).toBeNull();
  });

  it("falls back to nearby paragraph text when the heading is gone", () => {
    document.body.innerHTML = `
      <p>The this() constructor invocation is used to call another constructor in the same class.</p>
    `;
    const paragraph = document.querySelector("p")!;
    setRect(paragraph, 64);

    const found = locateAnchor(
      document,
      {
        type: "heading",
        value: "The this() constructor invocation is used to call another constructor",
        tagName: "h2",
      },
      0,
    );

    expect(found).toBe(paragraph);
  });
});
