import type { CapturedPosition, ResumeCheckpoint } from "../types/checkpoint";
import { normalizeUrl } from "../utils/url";
import { createCheckpointId } from "./checkpoint-store";

export function checkpointFromCapture(
  position: CapturedPosition,
  options: { name?: string; existing?: ResumeCheckpoint; autoUpdate?: boolean } = {},
): ResumeCheckpoint {
  const timestamp = Date.now();
  const title = position.title || position.url;
  const autoUpdate = options.autoUpdate ?? options.existing?.autoUpdate;
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
    ...(autoUpdate ? { autoUpdate: true } : {}),
  };
}
