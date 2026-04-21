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
      { href: "/shop", label: "All products" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/science", label: "How it works" },
      { href: "/founder", label: "About the company" },
      { href: "/testimonials", label: "Reviews" },
      { href: "/blog", label: "Journal" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/international-shipping", label: "International shipping" },
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
    <footer className="mt-24 bg-navy-800 text-surface">
      <div className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Wordmark variant="dark" size="md" />
            <p className="mt-6 text-sm leading-relaxed text-surface/80 max-w-sm">
              IP-6 Research, Inc. develops research-grade consumer products around inositol hexaphosphate, manufactured to cGMP and tested by independent laboratories.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-surface/55">
              15 Charles Plaza, Suite 2508 · Baltimore, MD 21201
            </p>
            <p className="mt-2 text-sm">
              <a href="mailto:hello@ip6original.com" className="text-sky-300 hover:text-sky-200">
                hello@ip6original.com
              </a>
            </p>
          </div>

          {COL.map((c) => (
            <div key={c.heading}>
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-surface/55 mb-4 font-semibold">
                {c.heading}
              </h3>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-surface/85 hover:text-coral-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {showDshea ? (
          <p className="mt-14 pt-8 border-t border-navy-600 text-xs leading-relaxed text-surface/55 max-w-3xl">
            <span className="text-surface/80 font-medium">FDA Disclaimer: </span>
            {DSHEA_DISCLAIMER}
          </p>
        ) : null}

        <div className="mt-8 pt-6 border-t border-navy-600 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-surface/55">
          <p>© {new Date().getFullYear()} IP-6 Research, Inc. All rights reserved.</p>
          <p className="text-surface/40">ip6original.com</p>
        </div>
      </div>
    </footer>
  );
}
