import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Analytics } from "@/components/layout/Analytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { isEuOrUk } from "@/lib/utils";
import { hreflangAlternates } from "@/lib/i18n";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "IP-6 Research, Inc.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteName} · Science-backed wellness`, template: `%s · ${siteName}` },
  description:
    "Premium supplements, cortisone-free skincare, and gravity-fed water filtration, built to research-grade specifications.",
  applicationName: siteName,
  alternates: hreflangAlternates("/"),
  openGraph: {
    type: "website",
    siteName,
    url: siteUrl,
    title: `${siteName} · Science-backed wellness`,
    description:
      "Premium supplements, cortisone-free skincare, and gravity-fed water filtration, built to research-grade specifications.",
  },
  twitter: { card: "summary_large_image", title: siteName },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#002C5C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = headers();
  const country =
    hdrs.get("cloudfront-viewer-country") ??
    hdrs.get("x-vercel-ip-country") ??
    hdrs.get("x-country") ??
    undefined;

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    sameAs: [] as string[],
  };

  return (
    <html lang="en" className={`${sans.variable}`} style={{ ["--font-display" as string]: "var(--font-body)" }}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-navy-800 focus:text-surface focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        <Navigation />
        <main id="main">{children}</main>
        <CartDrawer />
        <CookieBanner isEuOrUk={isEuOrUk(country)} />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </body>
    </html>
  );
}
