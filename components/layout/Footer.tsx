import Link from "next/link";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { Wordmark } from "@/components/layout/Wordmark";

const COL = [
  {
    heading: "Shop",
    links: [
      { href: "/shop/ip6-original-supplement", label: "IP6 Original" },
      { href: "/how-to-take", label: "How to Take" },
      { href: "/account", label: "My Account" },
    ],
  },
  {
    heading: "Story",
    links: [
      { href: "/story", label: "The Story" },
      { href: "/the-difference", label: "The Difference" },
      { href: "/founder", label: "The Founder" },
      { href: "#", label: "IP-6 Research Foundation", external: true },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/international-shipping", label: "Shipping" },
      { href: "/legal/refund-policy", label: "Returns" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/cookie-policy", label: "Cookies" },
      { href: "/legal/accessibility", label: "Accessibility" },
    ],
  },
];

export function Footer({ showDshea = false }: { showDshea?: boolean }) {
  return (
    <footer className="mt-20 bg-navy-800 text-surface">
      <div className="container py-12">
        {/* Brand block on top for mobile, inline on desktop */}
        <div className="md:grid md:grid-cols-[1fr_2.4fr] md:gap-10">
          <div className="mb-10 md:mb-0">
            <Wordmark variant="dark" size="sm" />
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-surface/55">
              15 Charles Plaza, Baltimore MD
            </p>
            <p className="mt-1 text-sm">
              <a href="mailto:hello@ip6original.com" className="text-sky-300 hover:text-sky-200">
                hello@ip6original.com
              </a>
            </p>
          </div>

          {/* Link groups - always side-by-side. Four columns on sm+, two on mobile. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {COL.map((c) => (
              <div key={c.heading}>
                <h3 className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-surface/55 mb-3 font-semibold">
                  {c.heading}
                </h3>
                <ul className="space-y-2">
                  {c.links.map((l) =>
                    "external" in l && l.external ? (
                      <li key={l.href + l.label}>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-surface/85 hover:text-sky-300 leading-snug block"
                        >
                          {l.label} ↗
                        </a>
                      </li>
                    ) : (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="text-xs sm:text-sm text-surface/85 hover:text-sky-300 leading-snug block"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {showDshea ? (
          <p className="mt-10 pt-6 border-t border-navy-600 text-xs leading-relaxed text-surface/55 max-w-3xl">
            <span className="text-surface/80 font-medium">FDA Disclaimer: </span>
            {DSHEA_DISCLAIMER}
          </p>
        ) : null}

        <div className="mt-6 pt-4 border-t border-navy-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-surface/55">
          <span>© {new Date().getFullYear()} IP-6 Research, Inc.</span>
          <span className="text-surface/45">Ships to the US and Canada at launch · Manufactured in Baltimore, MD</span>
        </div>
      </div>
    </footer>
  );
}
