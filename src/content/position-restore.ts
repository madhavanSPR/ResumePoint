import type { RestorePayload, RestoreResult } from "../types/checkpoint";
import { locateAnchor } from "./find-anchor";
import { createRestoreScheduler } from "./restore-scheduler";

function scrollWindow(win: Window, left: number, top: number): void {
  win.scrollTo({ left, top: Math.max(0, top), behavior: "auto" });
}

function alignToElement(win: Window, element: Element, offsetY: number, scrollX: number): void {
  const top = element.getBoundingClientRect().top + win.scrollY - offsetY;
  scrollWindow(win, scrollX, top);
}

export function attemptRestore(payload: RestorePayload, win: Window = window): RestoreResult {
  const doc = win.document;
  if (!doc.body) {
    return { ok: false, message: "pending" };
  }

  const offsetY = payload.anchor?.viewportOffsetY ?? 80;
  let element = payload.anchor ? locateAnchor(doc, payload.anchor, payload.scrollY) : null;

  if (!element && payload.anchor) {
    scrollWindow(win, payload.scrollX, payload.scrollY);
    element = locateAnchor(doc, payload.anchor, payload.scrollY);
  }

  if (element) {
    alignToElement(win, element, offsetY, payload.scrollX);
    return { ok: true, method: "anchor" };
  }

  scrollWindow(win, payload.scrollX, payload.scrollY);
  return { ok: true, method: "scroll" };
}

function debounceObserve(callback: () => void, wait = 200): () => void {
  let timer: number | undefined;
  const observer = new MutationObserver(() => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      callback();
    }, wait);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    observer.disconnect();
  };
}

export async function restorePosition(payload: RestorePayload): Promise<RestoreResult> {
  const scheduler = createRestoreScheduler({
    attempt: () => {
      const result = attemptRestore(payload);
      if (!result.ok && result.message === "pending") {
        return "pending";
      }
      if (result.ok && result.method === "anchor") {
        return "anchor";
      }
      if (result.ok && result.method === "scroll") {
        return "scroll";
      }
      return "fail";
    },
    observe: (callback) => debounceObserve(callback),
  });

  const outcome = await scheduler.start();
  if (outcome.ok) {
    return { ok: true, method: outcome.method };
  }
  return {
    ok: false,
    message: "Page opened, but the previous position could not be restored.",
  };
}
