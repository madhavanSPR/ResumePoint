import type { ContentAnchor } from "../types/checkpoint";
import { clipText, normalizeText, textMatches } from "./text";

export const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
export const TEXT_SELECTOR = "p, li, blockquote, pre, td, dd, figcaption, article, section";

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

function isUsableElement(element: Element, minLength: number): boolean {
  const text = normalizeText(element.textContent ?? "");
  if (text.length < minLength) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function scoreElement(element: Element, targetY: number): number {
  const top = element.getBoundingClientRect().top;
  if (top <= targetY + 24) {
    return targetY - top;
  }
  return top - targetY + 400;
}

function pickClosest(elements: Element[], targetY: number): Element | undefined {
  let best: Element | undefined;
  let bestScore = Infinity;
  for (const element of elements) {
    const score = scoreElement(element, targetY);
    if (score < bestScore) {
      bestScore = score;
      best = element;
    }
  }
  return best;
}

function nearbyHeading(doc: Document, element: Element): string | undefined {
  const headings = [...doc.querySelectorAll(HEADING_SELECTOR)];
  const index = headings.indexOf(element);
  const search = index >= 0 ? headings.slice(0, index) : headings;
  for (let i = search.length - 1; i >= 0; i -= 1) {
    const heading = search[i];
    const rect = heading.getBoundingClientRect();
    const current = element.getBoundingClientRect();
    if (rect.top <= current.top + 4) {
      const text = clipText(heading.textContent ?? "", 200);
      if (text) {
        return text;
      }
    }
  }
  return undefined;
}

function previousContext(element: Element): string | undefined {
  let sibling = element.previousElementSibling;
  while (sibling) {
    const text = clipText(sibling.textContent ?? "", 160);
    if (text.length >= 12) {
      return text;
    }
    sibling = sibling.previousElementSibling;
  }
  return undefined;
}

function elementIdOf(element: Element): string | undefined {
  if (!(element instanceof HTMLElement) || !element.id) {
    return undefined;
  }
  const found = element.ownerDocument.getElementById(element.id);
  return found === element ? element.id : undefined;
}

export function captureAnchor(
  doc: Document,
  viewport: ViewportInfo,
): ContentAnchor | undefined {
  const targetY = viewport.height * 0.25;
  const headings = [...doc.querySelectorAll(HEADING_SELECTOR)].filter((element) =>
    isUsableElement(element, 2),
  );
  const texts = [...doc.querySelectorAll(TEXT_SELECTOR)].filter((element) =>
    isUsableElement(element, 8),
  );

  const chosen =
    pickClosest(headings, targetY) ?? pickClosest(texts, targetY);
  if (!chosen) {
    return undefined;
  }

  const value = clipText(chosen.textContent ?? "", 120);
  if (!value) {
    return undefined;
  }

  const type: ContentAnchor["type"] = chosen.matches(HEADING_SELECTOR) ? "heading" : "text";
  const nearby = type === "heading" ? value : nearbyHeading(doc, chosen);
  const context = previousContext(chosen);
  const elementId = elementIdOf(chosen);

  return {
    type,
    value,
    tagName: chosen.tagName.toLowerCase(),
    viewportOffsetY: Math.round(chosen.getBoundingClientRect().top),
    ...(nearby ? { nearbyHeading: nearby } : {}),
    ...(context ? { context } : {}),
    ...(elementId ? { elementId } : {}),
  };
}

function documentOffsetTop(element: Element): number {
  const rect = element.getBoundingClientRect();
  const win = element.ownerDocument.defaultView;
  return rect.top + (win?.scrollY ?? 0);
}

function closestToScroll(elements: Element[], scrollY: number): Element | undefined {
  if (elements.length === 0) {
    return undefined;
  }
  let best = elements[0];
  let bestDistance = Infinity;
  for (const element of elements) {
    const distance = Math.abs(documentOffsetTop(element) - scrollY);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = element;
    }
  }
  return best;
}

function matchingElements(doc: Document, selector: string, anchor: ContentAnchor): Element[] {
  return [...doc.querySelectorAll(selector)].filter((element) =>
    textMatches(element.textContent ?? "", anchor.value),
  );
}

export function locateAnchor(
  doc: Document,
  anchor: ContentAnchor,
  scrollY = 0,
): Element | null {
  if (anchor.elementId) {
    const byId = doc.getElementById(anchor.elementId);
    if (byId && textMatches(byId.textContent ?? "", anchor.value)) {
      return byId;
    }
  }

  const tagSelector =
    anchor.tagName && /^[a-z][a-z0-9]*$/i.test(anchor.tagName)
      ? anchor.tagName
      : undefined;

  if (anchor.type === "heading") {
    const headingMatches = matchingElements(doc, tagSelector ?? HEADING_SELECTOR, anchor);
    const heading = closestToScroll(headingMatches, scrollY);
    if (heading) {
      return heading;
    }
  }

  const scoped = tagSelector
    ? matchingElements(doc, tagSelector, anchor)
    : [];
  const textMatchesFound = matchingElements(doc, TEXT_SELECTOR, anchor);
  const headingMatchesFound = matchingElements(doc, HEADING_SELECTOR, anchor);
  return (
    closestToScroll(scoped, scrollY) ??
    closestToScroll(textMatchesFound, scrollY) ??
    closestToScroll(headingMatchesFound, scrollY) ??
    null
  );
}
