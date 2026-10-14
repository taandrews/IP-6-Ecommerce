import Link from "next/link";
import Image from "next/image";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";

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

export function Footer({ showDshea = false }: { showDshea?: boolean }) {
  return (
    <footer className="mt-24 border-t-[3px] border-navy-800 bg-surface text-navy-800">
      <div className="container">
        <div className="grid gap-12 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0">
          <div className="lg:pr-14">
            <Link href="/" aria-label="IP6 Original, Home" className="inline-block">
              <Image src="/brand/ip6-original-logo.png" alt="IP6 Original" width={324} height={216} className="h-20 w-auto" />
            </Link>
            <p className="mt-6 max-w-[30ch] text-xl font-medium leading-snug tracking-[-0.01em]">
              One supplement, made to the specification his research describes.
            </p>
            <Link
              href="/shop/ip6-original-supplement"
              className="mt-7 inline-flex items-center rounded-full bg-navy-800 px-7 py-3 text-sm font-semibold text-surface transition-colors hover:bg-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-600"
            >
              Shop IP6 Original
            </Link>
            <address className="mt-8 not-italic text-sm leading-relaxed text-navy-800/70">
              15 Charles Plaza, Baltimore, MD
              <br />
              <a href="mailto:hello@ip6original.com" className="underline decoration-gold-500 underline-offset-4 hover:text-gold-700">
                hello@ip6original.com
              </a>
            </address>
          </div>

          <div className="grid grid-cols-2 gap-y-10 border-t border-navy-800/10 pt-10 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pt-0">
            {GROUPS.map((g, i) => (
              <nav
                key={g.heading}
                aria-label={g.heading}
                className={i > 0 ? "sm:border-l sm:border-navy-800/10 sm:pl-8 lg:pl-10" : "lg:pl-12"}
              >
                <h3 className="text-[15px] font-semibold">{g.heading}</h3>
                <span className="mt-2 block h-0.5 w-6 bg-gold-500" aria-hidden />
                <ul className="mt-5 space-y-3">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] text-navy-800/70 transition-colors hover:text-gold-700">
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
          <p className="border-t border-navy-800/10 py-6 text-xs leading-relaxed text-navy-800/55">{DSHEA_DISCLAIMER}</p>
        ) : null}
      </div>

      <div className="bg-navy-800 text-surface/75">
        <div className="container flex flex-col items-center gap-3 py-5 text-xs sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} IP6 Original. All rights reserved.</span>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-gold-300">
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
