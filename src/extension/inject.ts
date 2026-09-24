import contentScript from "../content/content-script?script";
import type { ExtensionResponse } from "../types/messages";

export async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: "PING",
    })) as ExtensionResponse | undefined;
    if (response?.type === "PONG") {
      return true;
    }
  } catch {
    // Content script is not present yet.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScript],
    });
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: "PING",
    })) as ExtensionResponse | undefined;
    return response?.type === "PONG";
  } catch {
    return false;
  }
}
