/**
 * The site's own origin for links that leave the site (emails, payment
 * redirects). Never taken from the request's Host header in production (it
 * can be spoofed to send a token or a shopper to another site); production
 * uses NEXT_PUBLIC_SITE_URL. Local development falls back to the request.
 */
export function siteOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
  if (process.env.NODE_ENV === "production") {
    if (!configured) throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
    return configured;
  }
  return new URL(req.url).origin;
}

/** The configured site origin, for links built outside a request (webhooks, jobs). */
export function configuredSiteOrigin() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  return new URL(url).origin;
}
