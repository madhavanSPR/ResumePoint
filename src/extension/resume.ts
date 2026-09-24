import type { ResumeCheckpoint, RestorePayload } from "../types/checkpoint";
import type { ExtensionResponse } from "../types/messages";
import { findMatchingTab } from "../utils/matching";
import { ensureContentScript } from "./inject";
import { setLastNotice } from "./notices";
import { clearPendingRestore, peekPendingRestore, setPendingRestore } from "./pending-restore";

function toPayload(checkpoint: ResumeCheckpoint): RestorePayload {
  return {
    id: checkpoint.id,
    url: checkpoint.url,
    scrollX: checkpoint.scrollX,
    scrollY: checkpoint.scrollY,
    documentHeight: checkpoint.documentHeight,
    anchor: checkpoint.anchor,
  };
}

async function trySendRestore(tabId: number, payload: RestorePayload): Promise<boolean> {
  const ready = await ensureContentScript(tabId);
  if (!ready) {
    return false;
  }

  try {
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: "RESTORE",
      payload,
    })) as ExtensionResponse | undefined;
    return response?.type === "RESTORE_RESULT";
  } catch {
    return false;
  }
}

export async function sendPendingIfAny(tabId: number): Promise<void> {
  const payload = await peekPendingRestore(tabId);
  if (!payload) {
    return;
  }
  await trySendRestore(tabId, payload);
}

export async function resumeCheckpoint(checkpoint: ResumeCheckpoint): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const existing = findMatchingTab(tabs, checkpoint.url);
  let tabId: number | undefined;
  let created = false;

  if (existing?.id) {
    tabId = existing.id;
    if (existing.windowId !== undefined) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
    await chrome.tabs.update(tabId, { active: true });
  } else {
    const tab = await chrome.tabs.create({ url: checkpoint.url, active: true });
    tabId = tab.id;
    created = true;
  }

  if (!tabId) {
    await setLastNotice("Unable to open this page. The URL may no longer be available.");
    throw new Error("Unable to open this page. The URL may no longer be available.");
  }

  await setPendingRestore(tabId, toPayload(checkpoint));
  const sent = await trySendRestore(tabId, toPayload(checkpoint));
  if (!sent && !created) {
    await sendPendingIfAny(tabId);
  }
}

export async function handleTabComplete(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
  const url = tab.url ?? "";
  if (url.startsWith("chrome-error://") || url.startsWith("about:neterror")) {
    const pending = await peekPendingRestore(tabId);
    if (pending) {
      await setLastNotice("Unable to open this page. The URL may no longer be available.");
      await clearPendingRestore(tabId);
    }
    return;
  }
  await sendPendingIfAny(tabId);
}
