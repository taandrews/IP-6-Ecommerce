import Link from "next/link";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";

const COL = [
  {
    heading: "Shop",
    links: [
      { href: "/shop/ip6-original-supplement", label: "IP6 Original Supplement" },
      { href: "/shop/ip6-la-sante-cream", label: "IP6 La Santé Cream" },
      { href: "/shop/ip6-citrate-water-filter", label: "IP6-Citrate Water Filter" },
      { href: "/shop", label: "All products" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/founder", label: "The Founder" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/blog", label: "Journal" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Customer care",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/international-shipping", label: "International shipping" },
      { href: "/legal/shipping-policy", label: "Shipping policy" },
      { href: "/legal/refund-policy", label: "Refund policy" },
      { href: "/account", label: "My account" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/cookie-policy", label: "Cookie policy" },
      { href: "/legal/accessibility", label: "Accessibility statement" },
    ],
  },
];

export function Footer({ showDshea = false }: { showDshea?: boolean }) {
  return (
    <footer className="mt-24 bg-forest-800 text-ivory-100">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block size-9 rounded-full bg-gold-400 grid place-items-center text-forest-900 font-display">
                IP6
              </span>
              <span className="font-display text-xl">IP-6 Research, Inc.</span>
            </div>
            <p className="text-ivory-100/80 leading-relaxed max-w-sm">
              Science-backed wellness, held to institutional standards. Premium supplements, cortisone-free skincare, and gravity-fed filtration.
            </p>
            <form className="mt-6 flex gap-2 max-w-sm" aria-label="Email newsletter">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="you@example.com"
                className="flex-1 rounded-md bg-forest-900 border border-forest-600 px-3 py-2.5 text-sm text-ivory-100 placeholder:text-ivory-100/50 focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:outline-none"
              />
              <button type="submit" className="bg-gold-400 text-forest-900 font-medium px-4 py-2.5 rounded-md hover:bg-gold-500">
                Subscribe
              </button>
            </form>
          </div>

          {COL.map((col) => (
            <div key={col.heading}>
              <h3 className="font-display text-gold-300 text-sm uppercase tracking-[0.18em] mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ivory-100/85 hover:text-gold-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {showDshea ? (
          <div className="mt-14 border-t border-forest-600 pt-8">
            <p className="text-xs text-ivory-100/70 leading-relaxed max-w-3xl">
              <strong className="text-ivory-100">Disclaimer:</strong> {DSHEA_DISCLAIMER}
            </p>
          </div>
        ) : null}

        <div className="mt-10 pt-8 border-t border-forest-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-ivory-100/70">
          <p>© {new Date().getFullYear()} IP-6 Research, Inc. All rights reserved.</p>
          <p className="text-ivory-100/50">ip6original.com</p>
        </div>
      </div>
    </footer>
  );
}
