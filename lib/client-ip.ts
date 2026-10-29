/**
 * The visitor's real IP address, for rate limits and the admin audit log.
 *
 * X-Forwarded-For grows left to right: whatever the visitor sent comes first,
 * then each proxy appends the address it received the request from. On
 * Amplify Hosting the chain ends "<visitor>, <CloudFront edge>" (verified on
 * the live site: the last entry is a CloudFront origin-facing address), so
 * after dropping private hops the visitor is the entry before the one trusted
 * proxy. Anything further left was written by the visitor and is ignored.
 * No Node built-ins, so the middleware can use it too.
 */

/** Proxies in front of the app that append to X-Forwarded-For (CloudFront). */
const TRUSTED_PROXY_HOPS = 1;

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
  while (hops.length && isPrivate(hops[hops.length - 1]!)) hops.pop();
  if (hops.length > TRUSTED_PROXY_HOPS) return hops[hops.length - 1 - TRUSTED_PROXY_HOPS]!;
  return hops[0] ?? fallback ?? "unknown";
}
