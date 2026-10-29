/**
 * Content-Security-Policy: pages may only load scripts, frames and data from
 * this site and the services it uses (Stripe, Google Analytics, Meta Pixel,
 * Algolia, Sanity, the CloudFront media CDN). Next.js inlines small scripts,
 * so 'unsafe-inline' stays for scripts; the host list still blocks anything
 * injected from elsewhere. Development also needs 'unsafe-eval' for hot reload.
 */
const dev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net`,
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async redirects() {
    return [
      { source: "/science", destination: "/story", permanent: false },
      { source: "/about", destination: "/story#founder", permanent: false },
      { source: "/founder", destination: "/story#founder", permanent: true },
      { source: "/why-ip6", destination: "/the-difference", permanent: false },
      { source: "/why-ip6/:path*", destination: "/the-difference", permanent: false },
      { source: "/lifestyle", destination: "/story", permanent: false },
      { source: "/savings", destination: "/shop/ip6-original-supplement", permanent: false },
    ];
  },
};

export default nextConfig;
