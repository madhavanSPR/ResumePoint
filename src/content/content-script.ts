import type { ExtensionMessage, ExtensionResponse } from "../types/messages";
import type { RestorePayload } from "../types/checkpoint";
import { capturePosition } from "./position-capture";
import { restorePosition } from "./position-restore";
import { showPageNotice } from "./notice";

let activeRestoreId: string | null = null;

async function runRestore(payload: RestorePayload): Promise<ExtensionResponse> {
  if (activeRestoreId === payload.id) {
    return { type: "RESTORE_RESULT", result: { ok: true, method: "scroll" } };
  }
  activeRestoreId = payload.id;
  const result = await restorePosition(payload);
  if (!result.ok) {
    showPageNotice(
      result.message ?? "Page opened, but the previous position could not be restored.",
      "error",
    );
  }
  void chrome.runtime.sendMessage({ type: "RESTORE_DONE" });
  return { type: "RESTORE_RESULT", result };
}

async function requestPendingRestore(): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({
      type: "GET_PENDING_RESTORE",
    })) as ExtensionResponse | undefined;
    if (response?.type === "PENDING_RESTORE" && response.payload) {
      await runRestore(response.payload);
    }
  } catch {
    // The service worker may be waking up; onUpdated will retry.
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ type: "PONG" } satisfies ExtensionResponse);
      return;
    }

    if (message.type === "CAPTURE") {
      sendResponse({
        type: "CAPTURE_RESULT",
        position: capturePosition(),
      } satisfies ExtensionResponse);
      return;
    }

    if (message.type === "SHOW_NOTICE") {
      showPageNotice(message.message, message.kind ?? "info");
      sendResponse({ type: "OK" } satisfies ExtensionResponse);
      return;
    }

    if (message.type === "RESTORE") {
      void runRestore(message.payload).then(sendResponse);
      return true;
    }
  },
);

void requestPendingRestore();
