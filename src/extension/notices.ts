const NOTICE_KEY = "resumepoint.notice";

export async function setLastNotice(message: string, kind: "error" | "info" = "error"): Promise<void> {
  await chrome.storage.session.set({
    [NOTICE_KEY]: { message, kind, at: Date.now() },
  });
  await chrome.action.setBadgeBackgroundColor({
    color: kind === "error" ? "#C23B3B" : "#3D4FD7",
  });
  await chrome.action.setBadgeText({ text: kind === "error" ? "!" : "✓" });
}

export async function flashBadge(text = "✓"): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: "#3D4FD7" });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => {
    void chrome.action.setBadgeText({ text: "" });
  }, 2000);
}

export async function consumeLastNotice(): Promise<string | null> {
  const result = await chrome.storage.session.get(NOTICE_KEY);
  const notice = result[NOTICE_KEY] as { message?: string } | undefined;
  if (!notice?.message) {
    return null;
  }
  await chrome.storage.session.remove(NOTICE_KEY);
  await chrome.action.setBadgeText({ text: "" });
  return notice.message;
}
