import type { CapturedPosition, ResumeCheckpoint } from "../types/checkpoint";
import type { ExtensionResponse } from "../types/messages";
import { createCheckpointId, findByNormalizedUrl, saveCheckpoint } from "../storage/checkpoint-store";
import { RESTRICTED_PAGE_MESSAGE, isRestrictedUrl } from "../utils/restricted";
import { normalizeUrl } from "../utils/url";
import { ensureContentScript } from "./inject";
import { flashBadge, setLastNotice } from "./notices";

export async function captureTab(tabId: number): Promise<CapturedPosition> {
  const ready = await ensureContentScript(tabId);
  if (!ready) {
    throw new Error(RESTRICTED_PAGE_MESSAGE);
  }

  const response = (await chrome.tabs.sendMessage(tabId, {
    type: "CAPTURE",
  })) as ExtensionResponse | undefined;

  if (response?.type !== "CAPTURE_RESULT") {
    throw new Error("Could not read the current page position.");
  }

  return response.position;
}

export function checkpointFromCapture(
  position: CapturedPosition,
  options: { name?: string; existing?: ResumeCheckpoint } = {},
): ResumeCheckpoint {
  const timestamp = Date.now();
  const title = position.title || position.url;
  return {
    id: options.existing?.id ?? createCheckpointId(),
    name: options.name?.trim() || options.existing?.name || title,
    title,
    url: position.url,
    normalizedUrl: normalizeUrl(position.url),
    scrollX: position.scrollX,
    scrollY: position.scrollY,
    documentHeight: position.documentHeight,
    anchor: position.anchor,
    createdAt: options.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function saveOrUpdateActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || isRestrictedUrl(tab.url)) {
    await setLastNotice(RESTRICTED_PAGE_MESSAGE);
    return;
  }

  try {
    const position = await captureTab(tab.id);
    const existing = await findByNormalizedUrl(normalizeUrl(position.url));
    const checkpoint = checkpointFromCapture(position, { existing });
    await saveCheckpoint(checkpoint);
    await chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_NOTICE",
      message: existing ? "Checkpoint updated" : "Page saved",
      kind: "success",
    });
    await flashBadge();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save this page.";
    await setLastNotice(message);
  }
}
