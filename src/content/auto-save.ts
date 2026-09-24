import { findByNormalizedUrl, saveCheckpoint } from "../storage/checkpoint-store";
import { checkpointFromCapture } from "../storage/from-capture";
import { STORE_KEY } from "../storage/schema";
import { positionMoved, type PositionSnapshot } from "../utils/position";
import { isRestrictedUrl } from "../utils/restricted";
import { normalizeUrl } from "../utils/url";
import { capturePosition } from "./position-capture";

const SCROLL_DEBOUNCE_MS = 800;
const RESTORE_GUARD_MS = 2500;

let restoreLockedUntil = 0;
let timer: number | undefined;
let lastWritten: PositionSnapshot | undefined;
let lastUrl = "";

export function pauseAutoSave(ms = RESTORE_GUARD_MS): void {
  restoreLockedUntil = Date.now() + ms;
}

function currentSnapshot(): PositionSnapshot {
  const position = capturePosition();
  return {
    scrollX: position.scrollX,
    scrollY: position.scrollY,
    anchorValue: position.anchor?.value,
  };
}

async function persistIfNeeded(): Promise<void> {
  if (Date.now() < restoreLockedUntil) {
    return;
  }
  if (isRestrictedUrl(location.href)) {
    return;
  }

  let normalized: string;
  try {
    normalized = normalizeUrl(location.href);
  } catch {
    return;
  }

  if (location.href !== lastUrl) {
    lastUrl = location.href;
    lastWritten = undefined;
  }

  const existing = await findByNormalizedUrl(normalized);
  if (!existing?.autoUpdate) {
    lastWritten = undefined;
    return;
  }

  const position = capturePosition();
  const next: PositionSnapshot = {
    scrollX: position.scrollX,
    scrollY: position.scrollY,
    anchorValue: position.anchor?.value,
  };

  if (!positionMoved(existing, next)) {
    return;
  }
  if (lastWritten && !positionMoved(lastWritten, next)) {
    return;
  }

  await saveCheckpoint(checkpointFromCapture(position, { existing }));
  lastWritten = next;
}

function schedulePersist(): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
  }
  timer = window.setTimeout(() => {
    timer = undefined;
    void persistIfNeeded();
  }, SCROLL_DEBOUNCE_MS);
}

function flushPersist(): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  void persistIfNeeded();
}

export function startAutoSave(): void {
  lastUrl = location.href;
  lastWritten = currentSnapshot();

  window.addEventListener("scroll", schedulePersist, { passive: true });
  window.addEventListener("pagehide", flushPersist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPersist();
    }
  });
  window.addEventListener("hashchange", flushPersist);
  window.addEventListener("popstate", flushPersist);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORE_KEY]) {
      lastWritten = undefined;
    }
  });
}
