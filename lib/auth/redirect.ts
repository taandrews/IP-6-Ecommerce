/**
 * Only same-site relative paths are allowed as a post-login destination,
 * which blocks open redirects such as ?next=//evil.example.
 */
export function safeNextPath(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string" || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (/[\r\n\t\\]/.test(next)) return fallback;
  return next;
}
