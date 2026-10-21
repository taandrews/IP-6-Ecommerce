/**
 * Opaque pagination cursors. A cursor from the browser is untrusted input,
 * so it is decoded only into the exact key attributes the query expects,
 * each a short string.
 */
export function encodeCursor(key: Record<string, unknown> | undefined): string | undefined {
  if (!key) return undefined;
  return Buffer.from(JSON.stringify(key)).toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined, allowed: readonly string[]): Record<string, string> | undefined {
  if (!cursor || cursor.length > 2048) return undefined;
  try {
    const raw = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!allowed.includes(k) || typeof v !== "string" || v.length > 512) return undefined;
      out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}
