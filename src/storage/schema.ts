import type {
  CheckpointStoreData,
  ContentAnchor,
  ResumeCheckpoint,
} from "../types/checkpoint";
import { normalizeUrl } from "../utils/url";

export const STORE_KEY = "resumepoint.store";
export const STORE_VERSION = 1 as const;

const LIMITS = {
  id: 80,
  name: 200,
  title: 500,
  url: 2048,
  normalizedUrl: 2048,
  tagName: 32,
  elementId: 200,
  nearbyHeading: 200,
  value: 300,
  context: 300,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, max);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sanitizeAnchor(value: unknown): ContentAnchor | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const text = asString(value.value, LIMITS.value);
  if (!text) {
    return undefined;
  }

  const type = value.type === "heading" || value.type === "text" ? value.type : "text";
  const tagName = asString(value.tagName, LIMITS.tagName);
  const nearbyHeading = asString(value.nearbyHeading, LIMITS.nearbyHeading);
  const context = asString(value.context, LIMITS.context);
  const elementId = asString(value.elementId, LIMITS.elementId);
  const viewportOffsetY = asNumber(value.viewportOffsetY);

  return {
    type,
    value: text,
    ...(tagName ? { tagName } : {}),
    ...(nearbyHeading ? { nearbyHeading } : {}),
    ...(context ? { context } : {}),
    ...(elementId ? { elementId } : {}),
    ...(viewportOffsetY !== undefined ? { viewportOffsetY } : {}),
  };
}

export function sanitizeCheckpoint(value: unknown): ResumeCheckpoint | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const url = asString(value.url, LIMITS.url);
  if (!url) {
    return undefined;
  }

  let normalizedUrl = asString(value.normalizedUrl, LIMITS.normalizedUrl);
  try {
    normalizedUrl = normalizeUrl(url);
  } catch {
    if (!normalizedUrl) {
      return undefined;
    }
  }

  const title = asString(value.title, LIMITS.title) ?? url;
  const name = asString(value.name, LIMITS.name) ?? title;
  const id = asString(value.id, LIMITS.id) ?? crypto.randomUUID();
  const createdAt = asNumber(value.createdAt) ?? Date.now();
  const updatedAt = asNumber(value.updatedAt) ?? createdAt;
  const scrollX = asNumber(value.scrollX) ?? 0;
  const scrollY = asNumber(value.scrollY) ?? 0;
  const documentHeight = asNumber(value.documentHeight) ?? 0;
  const anchor = sanitizeAnchor(value.anchor);

  return {
    id,
    name,
    title,
    url,
    normalizedUrl,
    scrollX,
    scrollY,
    documentHeight,
    createdAt,
    updatedAt,
    ...(anchor ? { anchor } : {}),
  };
}

export function emptyStore(): CheckpointStoreData {
  return { version: STORE_VERSION, checkpoints: [] };
}

export function sanitizeStore(value: unknown): CheckpointStoreData {
  if (!isRecord(value) || !Array.isArray(value.checkpoints)) {
    return emptyStore();
  }

  const seen = new Set<string>();
  const checkpoints: ResumeCheckpoint[] = [];

  for (const item of value.checkpoints) {
    const checkpoint = sanitizeCheckpoint(item);
    if (!checkpoint || seen.has(checkpoint.normalizedUrl)) {
      continue;
    }
    seen.add(checkpoint.normalizedUrl);
    checkpoints.push(checkpoint);
  }

  return { version: STORE_VERSION, checkpoints };
}

export function upsertCheckpoint(
  checkpoints: ResumeCheckpoint[],
  incoming: ResumeCheckpoint,
): ResumeCheckpoint[] {
  const byId = checkpoints.findIndex((checkpoint) => checkpoint.id === incoming.id);
  const byUrl = checkpoints.findIndex(
    (checkpoint) => checkpoint.normalizedUrl === incoming.normalizedUrl,
  );

  if (byId >= 0) {
    const existing = checkpoints[byId];
    const updated: ResumeCheckpoint = {
      ...existing,
      ...incoming,
      id: existing.id,
      name: incoming.name || existing.name,
      createdAt: existing.createdAt,
    };
    return checkpoints
      .filter(
        (checkpoint, index) =>
          index === byId || checkpoint.normalizedUrl !== incoming.normalizedUrl,
      )
      .map((checkpoint) => (checkpoint.id === existing.id ? updated : checkpoint));
  }

  if (byUrl === -1) {
    return [...checkpoints, incoming];
  }

  const existing = checkpoints[byUrl];
  const next = [...checkpoints];
  next[byUrl] = {
    ...existing,
    ...incoming,
    id: existing.id,
    name: incoming.name || existing.name,
    createdAt: existing.createdAt,
  };
  return next;
}

export function removeCheckpoint(
  checkpoints: ResumeCheckpoint[],
  id: string,
): ResumeCheckpoint[] {
  return checkpoints.filter((checkpoint) => checkpoint.id !== id);
}

export function parseImportPayload(value: unknown): ResumeCheckpoint[] {
  if (!isRecord(value) || !Array.isArray(value.checkpoints)) {
    throw new Error("Import file must be a JSON object with a checkpoints array.");
  }

  const checkpoints = value.checkpoints
    .map((item) => sanitizeCheckpoint(item))
    .filter((item): item is ResumeCheckpoint => Boolean(item));

  if (value.checkpoints.length > 0 && checkpoints.length === 0) {
    throw new Error("Import file did not contain any valid checkpoints.");
  }

  return checkpoints;
}

export function mergeImported(
  existing: ResumeCheckpoint[],
  incoming: ResumeCheckpoint[],
): ResumeCheckpoint[] {
  let next = [...existing];
  for (const item of incoming) {
    next = upsertCheckpoint(next, item);
  }
  return next;
}
