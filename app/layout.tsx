import type { Metadata, Viewport } from "next";
import { asset } from "@/lib/assets";
import { IBM_Plex_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Analytics } from "@/components/layout/Analytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PreBookPopup } from "@/components/layout/PreBookPopup";
import { isEuOrUk, jsonLd } from "@/lib/utils";
import { StoreSettingsProvider } from "@/components/store/StoreSettings";
import { GeoProvider } from "@/components/store/Geo";
import { ArrivalWaitlist } from "@/components/store/ArrivalWaitlist";
import { WAITLIST_PROMPT_COOKIE, type WaitlistPrompt } from "@/lib/waitlist-consent";
import { visitorGeo } from "@/lib/geo";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { getBannerSettings, getPreorderSettings, bannerIsLive } from "@/lib/data/settings";
import { hreflangAlternates } from "@/lib/i18n";
import { offerFor } from "@/lib/preorder";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const siteName = "IP6 Original";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteName} · Science-backed wellness`, template: `%s · ${siteName}` },
  description:
    "The original IP6 and Inositol supplement, formulated by the scientist who pioneered the research.",
  applicationName: siteName,
  alternates: hreflangAlternates("/"),
  openGraph: {
    type: "website",
    siteName,
    url: siteUrl,
    title: `${siteName} · Science-backed wellness`,
    description:
      "The original IP6 and Inositol supplement, formulated by the scientist who pioneered the research.",
  },
  twitter: { card: "summary_large_image", title: siteName },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B1F3A",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  // Set by middleware for /admin. The admin portal gets a bare document: no
  // storefront navigation, cart, pop-ups or analytics scripts.
  if (hdrs.get("x-ip6-area") === "admin") {
    return (
      <html lang="en" className={sans.variable} style={{ ["--font-display" as string]: "var(--font-body)" }}>
        <body>{children}</body>
      </html>
    );
  }
  // Per-request script nonce from the middleware (see lib/csp.ts).
  const nonce = hdrs.get("x-nonce") ?? undefined;
  const [preorder, banner] = await Promise.all([getPreorderSettings(), getBannerSettings()]);
  const geo = await visitorGeo();
  const promptCookie = (await cookies()).get(WAITLIST_PROMPT_COOKIE)?.value;
  const waitlistPrompt: WaitlistPrompt | null = promptCookie === "closed" || promptCookie === "joined" ? promptCookie : null;
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
    logo: asset("brand/ip6-original-logo.png"),
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
        <StoreSettingsProvider preorder={offerFor(preorder, geo.sellable)}>
        <GeoProvider country={geo.country} ipCountry={geo.ipCountry}>
          {/* The site banner carries the pre-order offer, which only applies where we sell. */}
          {geo.sellable && bannerIsLive(banner) ? <AnnouncementBar banner={banner} /> : null}
          <Navigation />
          <ArrivalWaitlist initial={waitlistPrompt} />
          <main id="main">{children}</main>
          <CartDrawer />
          <CookieBanner isEuOrUk={isEuOrUk(country)} />
          {/* The pre-order quiz sells to US visitors; elsewhere the launch list takes its place. */}
          {geo.sellable ? <PreBookPopup /> : null}
          <Analytics nonce={nonce} />
        </GeoProvider>
        </StoreSettingsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgSchema) }} />
      </body>
    </html>
  );
}
