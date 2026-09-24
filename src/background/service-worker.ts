import type { ExtensionMessage, ExtensionResponse } from "../types/messages";
import { SAVE_OR_UPDATE_COMMAND } from "../types/messages";
import { getCheckpoint } from "../storage/checkpoint-store";
import { clearPendingRestore, peekPendingRestore } from "../extension/pending-restore";
import { handleTabComplete, resumeCheckpoint } from "../extension/resume";
import { saveOrUpdateActiveTab } from "../extension/save-current";
import { setLastNotice } from "../extension/notices";

chrome.runtime.onInstalled.addListener(() => {
  void chrome.action.setBadgeBackgroundColor({ color: "#3D4FD7" });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === SAVE_OR_UPDATE_COMMAND) {
    void saveOrUpdateActiveTab();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    void handleTabComplete(tabId, tab);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearPendingRestore(tabId);
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === "GET_PENDING_RESTORE") {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ type: "PENDING_RESTORE", payload: null } satisfies ExtensionResponse);
        return;
      }
      void peekPendingRestore(tabId).then((payload) => {
        sendResponse({ type: "PENDING_RESTORE", payload } satisfies ExtensionResponse);
      });
      return true;
    }

    if (message.type === "RESTORE_DONE") {
      const tabId = sender.tab?.id;
      if (tabId) {
        void clearPendingRestore(tabId);
      }
      sendResponse({ type: "OK" } satisfies ExtensionResponse);
      return;
    }

    if (message.type === "RESUME_CHECKPOINT") {
      void (async () => {
        try {
          const checkpoint = await getCheckpoint(message.checkpointId);
          if (!checkpoint) {
            await setLastNotice("That checkpoint is no longer saved.");
            sendResponse({
              type: "ERROR",
              message: "That checkpoint is no longer saved.",
            } satisfies ExtensionResponse);
            return;
          }
          await resumeCheckpoint(checkpoint);
          sendResponse({ type: "OK" } satisfies ExtensionResponse);
        } catch (error) {
          const text =
            error instanceof Error
              ? error.message
              : "Unable to open this page. The URL may no longer be available.";
          sendResponse({ type: "ERROR", message: text } satisfies ExtensionResponse);
        }
      })();
      return true;
    }
  },
);
