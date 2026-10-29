/**
 * The visitor's real IP address, for rate limits and the admin audit log.
 *
 * CloudFront appends the address it saw on the TCP connection to the END of
 * X-Forwarded-For, after anything the client sent itself, so the leftmost
 * entries are whatever the visitor chose to write. Walking from the right and
 * skipping private hops (any proxy between CloudFront and the app) gives the
 * first address a client can't forge. No Node built-ins, so the middleware
 * can use it too.
 */

const PRIVATE = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // carrier-grade NAT, used inside AWS
  /^::1$/,
  /^f[cd][0-9a-f]{2}:/i,
  /^fe80:/i,
];

const isPrivate = (ip: string) => PRIVATE.some((re) => re.test(ip));

export function clientIpFrom(headers: Headers, fallback?: string): string {
  const hops = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (let i = hops.length - 1; i >= 0; i--) {
    if (!isPrivate(hops[i]!)) return hops[i]!;
  }
  return hops[0] ?? fallback ?? "unknown";
}
