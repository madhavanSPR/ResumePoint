import type { ResumeCheckpoint } from "../types/checkpoint";
import { normalizeUrl, urlsMatch } from "./url";

export function findMatchingCheckpoint(
  checkpoints: ResumeCheckpoint[],
  rawUrl: string | undefined,
): ResumeCheckpoint | undefined {
  if (!rawUrl) {
    return undefined;
  }

  const exact = checkpoints.find((checkpoint) => checkpoint.url === rawUrl);
  if (exact) {
    return exact;
  }

  try {
    const normalized = normalizeUrl(rawUrl);
    return checkpoints.find((checkpoint) => checkpoint.normalizedUrl === normalized);
  } catch {
    return undefined;
  }
}

export function findMatchingTab<T extends { id?: number; url?: string }>(
  tabs: T[],
  rawUrl: string,
): T | undefined {
  const exact = tabs.find((tab) => tab.url === rawUrl);
  if (exact) {
    return exact;
  }

  return tabs.find((tab) => tab.url && urlsMatch(tab.url, rawUrl));
}
