import Link from "next/link";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { Wordmark } from "@/components/layout/Wordmark";

const COL = [
  {
    heading: "Products",
    links: [
      { href: "/shop/ip6-original-supplement", label: "IP6 Original Supplement" },
      { href: "/shop/ip6-la-sante-cream", label: "IP6 La Santé Cream" },
      { href: "/shop/ip6-citrate-water-filter", label: "IP6-Citrate Water Filter" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/account", label: "My account" },
      { href: "/international-shipping", label: "Shipping" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/cookie-policy", label: "Cookies" },
      { href: "/legal/refund-policy", label: "Returns" },
      { href: "/legal/accessibility", label: "Accessibility" },
    ],
  },
];

export function Footer({ showDshea = false }: { showDshea?: boolean }) {
  return (
    <footer className="mt-20 bg-navy-800 text-surface">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-[1fr_repeat(3,1fr)]">
          <div>
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
          {COL.map((c) => (
            <div key={c.heading}>
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-surface/55 mb-3 font-semibold">
                {c.heading}
              </h3>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-surface/85 hover:text-sky-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {showDshea ? (
          <p className="mt-10 pt-6 border-t border-navy-600 text-xs leading-relaxed text-surface/55 max-w-3xl">
            <span className="text-surface/80 font-medium">FDA Disclaimer: </span>
            {DSHEA_DISCLAIMER}
          </p>
        ) : null}

        <div className="mt-6 pt-4 border-t border-navy-600 text-xs text-surface/55">
          © {new Date().getFullYear()} IP-6 Research, Inc.
        </div>
      </div>
    </footer>
  );
}
