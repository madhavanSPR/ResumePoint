const RESTRICTED_PROTOCOLS = new Set([
  "chrome:",
  "brave:",
  "edge:",
  "opera:",
  "vivaldi:",
  "about:",
  "chrome-extension:",
  "moz-extension:",
  "devtools:",
  "view-source:",
  "data:",
  "blob:",
  "file:",
  "javascript:",
]);

const RESTRICTED_HOSTS = new Set([
  "chrome.google.com",
  "chromewebstore.google.com",
  "microsoftedge.microsoft.com",
]);

export const RESTRICTED_PAGE_MESSAGE =
  "ResumePoint can't access this page. The browser blocks extensions on browser pages and the extension store.";

export function isRestrictedUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) {
    return true;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true;
  }

  if (RESTRICTED_PROTOCOLS.has(url.protocol)) {
    return true;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return true;
  }

  if (RESTRICTED_HOSTS.has(url.hostname)) {
    if (url.hostname === "chrome.google.com") {
      return url.pathname.startsWith("/webstore");
    }
    if (url.hostname === "microsoftedge.microsoft.com") {
      return url.pathname.startsWith("/addons");
    }
    return true;
  }

  return false;
}
