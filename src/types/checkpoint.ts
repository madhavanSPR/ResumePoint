export type AnchorType = "heading" | "text";

export interface ContentAnchor {
  type: AnchorType;
  value: string;
  tagName?: string;
  nearbyHeading?: string;
  context?: string;
  elementId?: string;
  viewportOffsetY?: number;
}

export interface CheckpointMedia {
  videoTimestamp?: number;
}

export interface ResumeCheckpoint {
  id: string;
  name: string;
  title: string;
  url: string;
  normalizedUrl: string;
  scrollX: number;
  scrollY: number;
  documentHeight: number;
  anchor?: ContentAnchor;
  createdAt: number;
  updatedAt: number;
  media?: CheckpointMedia;
}

export interface CheckpointStoreData {
  version: 1;
  checkpoints: ResumeCheckpoint[];
}

export interface CapturedPosition {
  url: string;
  title: string;
  scrollX: number;
  scrollY: number;
  documentHeight: number;
  anchor?: ContentAnchor;
}

export interface RestorePayload {
  id: string;
  url: string;
  scrollX: number;
  scrollY: number;
  documentHeight: number;
  anchor?: ContentAnchor;
}

export type RestoreMethod = "anchor" | "scroll";

export interface RestoreResult {
  ok: boolean;
  method?: RestoreMethod;
  message?: string;
}
