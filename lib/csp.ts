/**
 * Content-Security-Policy, built per request by the middleware.
 *
 * Scripts run only with this request's nonce. 'strict-dynamic' lets a
 * trusted script load what it needs (Next.js chunks, Stripe.js, Google
 * Analytics, the Meta Pixel), and nothing else can run: no injected inline
 * script, no script from another host. The host list after it is only read
 * by old browsers that don't understand 'strict-dynamic'.
 *
 * Styles keep 'unsafe-inline': React writes style attributes, and CSS can't
 * run code. No Node built-ins, so the Edge middleware can use it.
 */

const SCRIPT_HOSTS = "https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net";

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function contentSecurityPolicy(nonce: string, dev = process.env.NODE_ENV !== "production"): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""} ${SCRIPT_HOSTS}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.cloudfront.net https://cdn.sanity.io https://images.unsplash.com https://*.s3.amazonaws.com https://*.stripe.com https://www.googletagmanager.com https://*.google-analytics.com https://www.facebook.com",
    "font-src 'self' data:",
    "media-src 'self' blob: https://*.cloudfront.net",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://*.algolia.net https://*.algolianet.com https://*.api.sanity.io https://*.apicdn.sanity.io https://*.cloudfront.net https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://billing.stripe.com",
    "frame-ancestors 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** For API responses (JSON, files, the one plain confirmation page): no script may run and nothing may embed them. */
export const API_CSP = "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
