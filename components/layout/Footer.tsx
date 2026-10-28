import Link from "next/link";
import { asset } from "@/lib/assets";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { PrivacyChoicesButton } from "./PrivacyChoicesButton";
import { EMAIL } from "@/lib/email-addresses";

const GROUPS = [
  {
    heading: "Shop",
    links: [
      { href: "/shop#people", label: "IP6 Original" },
      { href: "/shop#pets", label: "Pet Powder" },
      { href: "/how-to-take", label: "How to Take" },
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
    <footer className="border-t-[3px] border-navy-800 bg-surface text-navy-800">
      <div className="container">
        <div className="grid gap-6 py-6 lg:py-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0">
          <div className="lg:pr-14">
            <Link href="/" aria-label="IP6 Original, Home" className="inline-block">
              <Image src={asset("brand/ip6-original-logo.png")} alt="IP6 Original" width={324} height={216} className="h-12 w-auto" />
            </Link>
            <p className="mt-3 max-w-[30ch] text-base font-medium leading-snug tracking-[-0.01em]">
              One supplement, made to the specification his research describes.
            </p>
            <Link
              href="/shop#people"
              className="mt-3 inline-flex items-center rounded-full bg-button px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-button-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-600"
            >
              Shop IP6 Original
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-x-3 border-t border-navy-800/10 pt-6 lg:border-l lg:border-t-0 lg:pt-0 content-start">
            {GROUPS.map((g, i) => (
              <nav
                key={g.heading}
                aria-label={g.heading}
                className={i > 0 ? "sm:border-l sm:border-navy-800/10 sm:pl-8 lg:pl-10" : "lg:pl-12"}
              >
                <h3 className="text-[15px] font-semibold">{g.heading}</h3>
                <span className="mt-2 block h-0.5 w-6 bg-gold-500" aria-hidden />
                <ul className="mt-3 space-y-2">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-navy-800/70 transition-colors hover:text-gold-700">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <address className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-navy-800/10 py-3 not-italic text-sm text-navy-800/70">
          <span>Lutherville, Maryland</span>
          <Link href="/contact" className="underline decoration-gold-500 underline-offset-4 hover:text-gold-700">Contact us</Link>
          <a href={`mailto:${EMAIL.hello}`} className="underline decoration-gold-500 underline-offset-4 hover:text-gold-700">{EMAIL.hello}</a>
          <a href="https://www.instagram.com/IP6original/" target="_blank" rel="noopener noreferrer" aria-label="IP6original on Instagram (opens in a new tab)" className="inline-flex min-h-11 items-center gap-2 text-navy-800 hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-600 sm:ml-auto">
            <Instagram size={20} aria-hidden="true" />
            <span>@IP6original</span>
          </a>
        </address>

        {showDshea ? (
          <p className="border-t border-navy-800/10 py-4 text-xs leading-relaxed text-navy-800/55">{DSHEA_DISCLAIMER}</p>
        ) : null}
      </div>

      <div className="bg-navy-800 text-surface/75">
        <div className="container flex flex-col items-center gap-3 py-4 text-xs sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} IP6 Original. All rights reserved.</span>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <PrivacyChoicesButton className="transition-colors hover:text-gold-300" />
            </li>
          </ul>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span>Made in USA</span>
            <a href="https://init1s.com/" className="whitespace-nowrap transition-colors hover:text-gold-300">Powered by i1s</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
