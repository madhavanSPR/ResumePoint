import type { CheckpointStoreData, ResumeCheckpoint } from "../types/checkpoint";
import {
  mergeImported,
  parseImportPayload,
  removeCheckpoint,
  sanitizeStore,
  STORE_KEY,
  upsertCheckpoint,
} from "./schema";

async function readStore(): Promise<CheckpointStoreData> {
  const result = await chrome.storage.local.get(STORE_KEY);
  return sanitizeStore(result[STORE_KEY]);
}

async function writeStore(store: CheckpointStoreData): Promise<void> {
  await chrome.storage.local.set({ [STORE_KEY]: store });
}

export async function listCheckpoints(): Promise<ResumeCheckpoint[]> {
  const store = await readStore();
  return store.checkpoints;
}

export async function getCheckpoint(id: string): Promise<ResumeCheckpoint | undefined> {
  const checkpoints = await listCheckpoints();
  return checkpoints.find((checkpoint) => checkpoint.id === id);
}

export async function findByNormalizedUrl(
  normalizedUrl: string,
): Promise<ResumeCheckpoint | undefined> {
  const checkpoints = await listCheckpoints();
  return checkpoints.find((checkpoint) => checkpoint.normalizedUrl === normalizedUrl);
}

export async function saveCheckpoint(checkpoint: ResumeCheckpoint): Promise<ResumeCheckpoint> {
  const store = await readStore();
  const checkpoints = upsertCheckpoint(store.checkpoints, checkpoint);
  const saved =
    checkpoints.find((item) => item.id === checkpoint.id) ??
    checkpoints.find((item) => item.normalizedUrl === checkpoint.normalizedUrl) ??
    checkpoint;
  await writeStore({ version: 1, checkpoints });
  return saved;
}

export async function deleteCheckpoint(id: string): Promise<void> {
  const store = await readStore();
  await writeStore({ version: 1, checkpoints: removeCheckpoint(store.checkpoints, id) });
}

export async function exportStore(): Promise<CheckpointStoreData> {
  return readStore();
}

export async function importStore(value: unknown): Promise<number> {
  const incoming = parseImportPayload(value);
  const store = await readStore();
  const checkpoints = mergeImported(store.checkpoints, incoming);
  await writeStore({ version: 1, checkpoints });
  return incoming.length;
}

export function createCheckpointId(): string {
  return crypto.randomUUID();
}
