export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeForMatch(value: string): string {
  return normalizeText(value).toLowerCase();
}

export function clipText(value: string, max: number): string {
  const text = normalizeText(value);
  return text.length <= max ? text : text.slice(0, max).trim();
}

export function textMatches(elementText: string, stored: string): boolean {
  const actual = normalizeForMatch(elementText);
  const expected = normalizeForMatch(stored);
  if (!actual || !expected) {
    return false;
  }
  if (actual === expected) {
    return true;
  }
  if (actual.includes(expected) || expected.includes(actual)) {
    return true;
  }
  const prefixLength = Math.min(40, expected.length);
  const prefix = expected.slice(0, prefixLength);
  return prefixLength >= 12 && actual.includes(prefix);
}
