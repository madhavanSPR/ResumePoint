const TRACKING_PARAMS = new Set([
  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "yclid",
  "msclkid",
  "si",
]);

function isTrackingParam(name: string): boolean {
  const key = name.toLowerCase();
  return key.startsWith("utm_") || TRACKING_PARAMS.has(key);
}

function isHashRouter(hash: string): boolean {
  return hash.startsWith("#/") || hash.startsWith("#!/") || hash.startsWith("#!");
}

export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  const kept = [...url.searchParams.entries()]
    .filter(([key]) => !isTrackingParam(key))
    .sort(([aKey, aVal], [bKey, bVal]) => {
      if (aKey === bKey) {
        return aVal.localeCompare(bVal);
      }
      return aKey.localeCompare(bKey);
    });

  url.search = "";
  for (const [key, value] of kept) {
    url.searchParams.append(key, value);
  }

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  url.pathname = path || "/";

  if (!isHashRouter(url.hash)) {
    url.hash = "";
  }

  return url.toString();
}

export function urlsMatch(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }

  try {
    return normalizeUrl(a) === normalizeUrl(b);
  } catch {
    return false;
  }
}

export function displayUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const text = `${url.host}${url.pathname}${url.search}`;
    return text.length > 72 ? `${text.slice(0, 69)}…` : text;
  } catch {
    return rawUrl;
  }
}
