/**
 * Resolve a site asset path against the CloudFront CDN.
 *
 * All images, fonts, and other static media live in the S3 assets bucket
 * (ip6original-assets-{env}) and are served via CloudFront. Use this helper
 * so the CDN domain can change per environment without touching content.
 *
 * Usage:
 *   asset("founder/shamsuddin.png")
 *   asset("products/supplement-1.jpg")
 *   asset("blog/the-science-behind-ip6.jpg")
 */
export const CDN: string =
  process.env.NEXT_PUBLIC_CDN_URL ||
  (process.env.CLOUDFRONT_DOMAIN ? `https://${process.env.CLOUDFRONT_DOMAIN}` : "");

export function asset(path: string): string {
  const clean = path.replace(/^\//, "");
  if (!CDN) return `/${clean}`;
  return `${CDN}/${clean}`;
}
