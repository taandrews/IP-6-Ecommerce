import Link from "next/link";
import Image from "next/image";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

const GROUPS = [
  {
    heading: "Shop",
    links: [
      { href: "/shop/ip6-original-supplement", label: "IP6 Original" },
      { href: "/faq#how-to-take", label: "How to Take" },
      { href: "/account", label: "My Account" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/story", label: "The Story" },
      { href: "/the-difference", label: "The Difference" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/international-shipping", label: "Shipping" },
      { href: "/legal/refund-policy", label: "Returns" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/cookie-policy", label: "Cookies" },
  { href: "/legal/accessibility", label: "Accessibility" },
];

/** Navy footer, cream text, mono legal links. Newsletter band on top. */
export function Footer({ showDshea = false }: { showDshea?: boolean }) {
  return (
    <footer className="bg-navy-800 text-cream">
      <div className="container">
        {/* Newsletter */}
        <div className="grid gap-8 border-b border-cream/15 py-[72px] lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-[96px]">
          <h2 className="max-w-[20ch] text-[32px] font-medium leading-[1.1] tracking-[-0.02em] lg:text-[48px]">
            Notes from the lab, only when there is something to say.
          </h2>
          <div className="lg:max-w-md lg:justify-self-end lg:w-full">
            <NewsletterForm dark />
          </div>
        </div>

        <div className="grid gap-12 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0">
          <div className="lg:pr-14">
            <Link href="/" aria-label="IP6 Original, Home" className="inline-block">
              <Image
                src="/brand/ip6-original-logo.png"
                alt="IP6 Original"
                width={324}
                height={216}
                loading="lazy"
                className="h-16 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-6 max-w-[30ch] text-lg leading-snug text-cream/85">
              One supplement, made to the specification his research describes.
            </p>
            <Link href="/shop/ip6-original-supplement" className="btn-gold mt-7">
              Shop IP6 Original
            </Link>
            <address className="mt-8 not-italic font-mono text-[12px] uppercase tracking-[0.12em] leading-relaxed text-cream/60">
              15 Charles Plaza, Baltimore, MD
              <br />
              <a href="mailto:hello@ip6original.com" className="normal-case tracking-normal underline decoration-gold-500 underline-offset-4 hover:text-gold-400">
                hello@ip6original.com
              </a>
            </address>
          </div>

          <div className="grid grid-cols-2 gap-y-10 border-t border-cream/15 pt-10 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pt-0">
            {GROUPS.map((g, i) => (
              <nav
                key={g.heading}
                aria-label={g.heading}
                className={i > 0 ? "sm:border-l sm:border-cream/15 sm:pl-8 lg:pl-10" : "lg:pl-12"}
              >
                <h3 className="font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400">{g.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] text-cream/80 transition-colors hover:text-gold-400">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {showDshea ? (
          <p className="border-t border-cream/15 py-6 text-xs leading-relaxed text-cream/60">{DSHEA_DISCLAIMER}</p>
        ) : null}
      </div>

      <div className="border-t border-cream/15 text-cream/60">
        <div className="container flex flex-col items-center gap-3 py-5 font-mono text-[11px] uppercase tracking-[0.12em] sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} IP6 Original. All rights reserved.</span>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-gold-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <span>Ships to the US and Canada</span>
        </div>
      </div>
    </footer>
  );
}
