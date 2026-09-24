import type { CapturedPosition, RestorePayload, RestoreResult } from "./checkpoint";

export type ExtensionMessage =
  | { type: "PING" }
  | { type: "CAPTURE" }
  | { type: "RESTORE"; payload: RestorePayload }
  | { type: "GET_PENDING_RESTORE" }
  | { type: "SHOW_NOTICE"; message: string; kind?: "info" | "error" | "success" }
  | { type: "RESUME_CHECKPOINT"; checkpointId: string }
  | { type: "RESTORE_DONE" };

export type ExtensionResponse =
  | { type: "PONG" }
  | { type: "CAPTURE_RESULT"; position: CapturedPosition }
  | { type: "RESTORE_RESULT"; result: RestoreResult }
  | { type: "PENDING_RESTORE"; payload: RestorePayload | null }
  | { type: "OK" }
  | { type: "ERROR"; message: string };

export const SAVE_OR_UPDATE_COMMAND = "save_or_update";
