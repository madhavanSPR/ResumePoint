type NoticeKind = "info" | "error" | "success";

const HOST_ID = "resumepoint-notice-host";

const COLORS: Record<NoticeKind, { bg: string; fg: string; border: string }> = {
  info: { bg: "#1c1917", fg: "#f5f2ec", border: "#44403c" },
  success: { bg: "#1c1917", fg: "#f5f2ec", border: "#3d4fd7" },
  error: { bg: "#1c1917", fg: "#f5f2ec", border: "#c23b3b" },
};

export function showPageNotice(message: string, kind: NoticeKind = "info"): void {
  document.getElementById(HOST_ID)?.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.left = "50%";
  host.style.bottom = "24px";
  host.style.transform = "translateX(-50%)";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "closed" });
  const toast = document.createElement("div");
  toast.setAttribute("role", "status");
  const palette = COLORS[kind];
  toast.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  toast.style.fontSize = "13px";
  toast.style.lineHeight = "1.4";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "10px";
  toast.style.background = palette.bg;
  toast.style.color = palette.fg;
  toast.style.border = `1px solid ${palette.border}`;
  toast.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.18)";
  toast.style.maxWidth = "360px";
  toast.textContent = message;
  shadow.appendChild(toast);
  document.documentElement.appendChild(host);

  window.setTimeout(() => host.remove(), 4200);
}
