import type { RestorePayload } from "../types/checkpoint";

const PENDING_KEY = "resumepoint.pending";

type PendingMap = Record<string, { payload: RestorePayload; createdAt: number }>;

async function readMap(): Promise<PendingMap> {
  const result = await chrome.storage.session.get(PENDING_KEY);
  const value = result[PENDING_KEY];
  return value && typeof value === "object" ? (value as PendingMap) : {};
}

export async function setPendingRestore(tabId: number, payload: RestorePayload): Promise<void> {
  const map = await readMap();
  map[String(tabId)] = { payload, createdAt: Date.now() };
  await chrome.storage.session.set({ [PENDING_KEY]: map });
}

export async function peekPendingRestore(tabId: number): Promise<RestorePayload | null> {
  const map = await readMap();
  return map[String(tabId)]?.payload ?? null;
}

export async function clearPendingRestore(tabId: number): Promise<void> {
  const map = await readMap();
  if (!map[String(tabId)]) {
    return;
  }
  delete map[String(tabId)];
  await chrome.storage.session.set({ [PENDING_KEY]: map });
}
