import { STORE_KEY } from "../storage/schema";
import { isRestrictedUrl } from "../utils/restricted";
import { normalizeUrl } from "../utils/url";
import { capturePosition } from "./position-capture";

const SCROLL_DEBOUNCE_MS = 250;
const RESTORE_GUARD_MS = 2500;

let restoreLockedUntil = 0;
let timer: number | undefined;
let autoUpdateEnabled = false;

export function pauseAutoSave(ms = RESTORE_GUARD_MS): void {
  restoreLockedUntil = Date.now() + ms;
}

function reportPosition(): void {
  if (Date.now() < restoreLockedUntil) {
    return;
  }
  if (isRestrictedUrl(location.href) || !autoUpdateEnabled) {
    return;
  }

  void chrome.runtime.sendMessage({
    type: "AUTO_SAVE",
    position: capturePosition(),
  });
}

function scheduleReport(): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
  }
  timer = window.setTimeout(() => {
    timer = undefined;
    reportPosition();
  }, SCROLL_DEBOUNCE_MS);
}

function flushReport(): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  reportPosition();
}

async function refreshAutoUpdateFlag(): Promise<void> {
  const result = await chrome.storage.local.get(STORE_KEY);
  const store = result[STORE_KEY] as
    | { checkpoints?: Array<{ normalizedUrl?: string; autoUpdate?: boolean }> }
    | undefined;
  try {
    const current = normalizeUrl(location.href);
    autoUpdateEnabled = Boolean(
      store?.checkpoints?.some(
        (checkpoint) => checkpoint.autoUpdate && checkpoint.normalizedUrl === current,
      ),
    );
  } catch {
    autoUpdateEnabled = false;
  }
}

export function startAutoSave(): void {
  void refreshAutoUpdateFlag();

  window.addEventListener("scroll", scheduleReport, { passive: true });
  window.addEventListener("pagehide", flushReport);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushReport();
    }
  });
  window.addEventListener("beforeunload", flushReport);
  window.addEventListener("hashchange", flushReport);
  window.addEventListener("popstate", flushReport);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORE_KEY]) {
      void refreshAutoUpdateFlag().then(() => {
        if (autoUpdateEnabled) {
          reportPosition();
        }
      });
    }
  });
}
