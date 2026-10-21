import "server-only";
import crypto from "node:crypto";

/**
 * Seals a customer's email into an opaque, tamper-proof token for admin
 * links, so email addresses never appear in URLs, browser history or
 * server access logs. AES-256-GCM with a key from ADMIN_LINK_KEY (32 bytes,
 * base64). Tokens expire after 12 hours.
 */
const TTL_MS = 12 * 60 * 60 * 1000;

function key(): Buffer {
  const raw = process.env.ADMIN_LINK_KEY;
  if (raw) {
    const k = Buffer.from(raw, "base64");
    if (k.length !== 32) throw new Error("ADMIN_LINK_KEY must be 32 bytes, base64-encoded");
    return k;
  }
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_LINK_KEY is not configured");
  // Local development only: one random key per process, kept on globalThis so
  // every route bundle shares it (links stop working when the server restarts).
  const g = globalThis as typeof globalThis & { __ip6DevLinkKey?: Buffer };
  g.__ip6DevLinkKey ??= crypto.randomBytes(32);
  return g.__ip6DevLinkKey;
}

export function sealEmail(email: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const payload = JSON.stringify({ e: email.trim().toLowerCase(), t: Date.now() });
  const body = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unsealEmail(token: string | null | undefined): string | null {
  if (!token || token.length > 1024) return null;
  try {
    const buf = Buffer.from(token, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const body = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const json = JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8")) as { e?: string; t?: number };
    if (typeof json.e !== "string" || typeof json.t !== "number") return null;
    if (Date.now() - json.t > TTL_MS) return null;
    return json.e;
  } catch {
    return null;
  }
}
