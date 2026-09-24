import type { CapturedPosition } from "../types/checkpoint";
import { findByNormalizedUrl, saveCheckpoint } from "../storage/checkpoint-store";
import { checkpointFromCapture } from "../storage/from-capture";
import { positionMoved } from "../utils/position";
import { isRestrictedUrl } from "../utils/restricted";
import { normalizeUrl } from "../utils/url";

const lastByTab = new Map<number, CapturedPosition>();

export function rememberTabPosition(tabId: number, position: CapturedPosition): void {
  lastByTab.set(tabId, position);
}

export function forgetTabPosition(tabId: number): void {
  lastByTab.delete(tabId);
}

export async function persistAutoSave(position: CapturedPosition): Promise<boolean> {
  if (isRestrictedUrl(position.url)) {
    return false;
  }

  let normalized: string;
  try {
    normalized = normalizeUrl(position.url);
  } catch {
    return false;
  }

  const existing = await findByNormalizedUrl(normalized);
  if (!existing?.autoUpdate) {
    return false;
  }

  if (
    !positionMoved(existing, {
      scrollX: position.scrollX,
      scrollY: position.scrollY,
      anchorValue: position.anchor?.value,
    })
  ) {
    return false;
  }

  await saveCheckpoint(checkpointFromCapture(position, { existing }));
  return true;
}

export async function persistTabOnClose(tabId: number): Promise<void> {
  const position = lastByTab.get(tabId);
  forgetTabPosition(tabId);
  if (!position) {
    return;
  }
  await persistAutoSave(position);
}
