/**
 * An absolute URL on this site for redirects and links. On Amplify the
 * request URL is the server's internal address (https://localhost:3000), so
 * the public origin comes from NEXT_PUBLIC_SITE_URL; the request's own origin
 * is only a fallback for local development.
 */
export function siteUrl(path: string, req: Request): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(path, new URL(configured).origin);
    } catch {
      /* fall through on a malformed setting */
    }
  }
  if (process.env.NODE_ENV === "production") console.error("[site-url] NEXT_PUBLIC_SITE_URL is not set; using the request origin");
  return new URL(path, new URL(req.url).origin);
}
