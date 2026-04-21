import Link from "next/link";
import { DSHEA_DISCLAIMER } from "@/lib/compliance/claim-linter";
import { Wordmark } from "@/components/layout/Wordmark";

const LINK_GROUPS = [
  {
    label: "Shop",
    links: [
      { href: "/shop/ip6-original-supplement", label: "IP6 Original Supplement" },
      { href: "/shop/ip6-la-sante-cream", label: "IP6 La Santé Cream" },
      { href: "/shop/ip6-citrate-water-filter", label: "IP6-Citrate Water Filter" },
    ],
  },
  {
    label: "Read",
    links: [
      { href: "/science", label: "The Science" },
      { href: "/founder", label: "The Founder" },
      { href: "/blog", label: "Journal" },
      { href: "/testimonials", label: "Testimonials" },
    ],
  },
  {
    label: "Care",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/international-shipping", label: "International shipping" },
      { href: "/legal/refund-policy", label: "Returns" },
    ],
  },
];

const LEGAL = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/cookie-policy", label: "Cookies" },
  { href: "/legal/accessibility", label: "Accessibility" },
];

export function Footer({ showDshea = false }: { showDshea?: boolean }) {
  return (
    <footer className="mt-32 bg-forest-800 text-ivory-100 relative overflow-hidden">
      {/* Per-section grain — inverted to read over dark ground */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage: "url(https://dcstwo4ifc9iy.cloudfront.net/ui/grain.svg)",
          backgroundSize: "260px 260px",
        }}
      />

      <div className="container pt-24 pb-14 relative">
        {/* Editorial lead: signed founder note */}
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] items-start mb-20">
          <div className="max-w-2xl">
            <p className="eyebrow text-gold-300 mb-5" style={{ color: "rgb(var(--gold) / 0.7)" }}>
              A note from the founder
            </p>
            <p
              className="font-display text-ivory-100 text-balance leading-[1.15]"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
            >
              &ldquo;What a wellness brand refuses to say is as important as what it does say. Every product we ship is held to the standard I would hold a peer-reviewed manuscript to.&rdquo;
            </p>
            <p className="mt-8 flex items-center gap-3 text-sm text-ivory-100/70">
              <span
                aria-hidden
                className="font-display italic text-gold-300"
                style={{ fontSize: "1.1rem", fontVariationSettings: '"opsz" 72, "SOFT" 90' }}
              >
                AbulKalam M. Shamsuddin
              </span>
              <span className="h-px w-8 bg-gold-400/60" aria-hidden />
              <span className="uppercase tracking-[0.24em] text-[11px]">Founder</span>
            </p>
          </div>

          {/* Oversized address block */}
          <address className="not-italic text-ivory-100/90 lg:text-right">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-300/80 mb-3">
              Correspondence
            </p>
            <p
              className="font-display leading-tight"
              style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)", fontVariationSettings: '"opsz" 72, "SOFT" 30' }}
            >
              15 Charles Plaza<br />
              Suite 2508<br />
              Baltimore, Maryland
            </p>
            <p className="mt-5 text-sm text-ivory-100/75">
              <a href="mailto:hello@ip6original.com" className="hover:text-gold-300 underline-offset-4 hover:underline">
                hello@ip6original.com
              </a>
            </p>
          </address>
        </div>

        {/* Subscription as a sentence, not a form */}
        <div className="border-y border-forest-600 py-10 mb-14">
          <form className="flex flex-wrap items-baseline gap-x-3 gap-y-4 text-ivory-100 text-lg">
            <span className="font-display italic text-ivory-100/85" style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.4rem)" }}>
              A monthly note on formulation, testing, and research.
            </span>
            <span className="text-sm text-ivory-100/60">Send it to</span>
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="you@example.com"
              className="bg-transparent border-b border-ivory-100/40 text-ivory-100 placeholder:text-ivory-100/35 focus:border-gold-300 focus:outline-none min-w-[220px] py-1.5 text-base"
            />
            <button
              type="submit"
              className="text-sm uppercase tracking-[0.22em] text-gold-300 hover:text-gold-200 border-b border-gold-400/40 hover:border-gold-300 pb-1"
            >
              Subscribe →
            </button>
          </form>
        </div>

        {/* Terse link columns */}
        <div className="grid sm:grid-cols-3 gap-10 mb-16">
          {LINK_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-gold-300/80 mb-4">
                {group.label}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-ivory-100/85 hover:text-gold-300"
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
          <p className="text-xs text-ivory-100/55 leading-relaxed max-w-3xl border-t border-forest-600 pt-8 mb-6">
            <strong className="text-ivory-100/75">Disclaimer:</strong> {DSHEA_DISCLAIMER}
          </p>
        ) : null}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pt-8 border-t border-forest-600">
          <Wordmark variant="dark" size="sm" />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ivory-100/55">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-gold-300">
                {l.label}
              </Link>
            ))}
            <span aria-hidden className="text-ivory-100/30">·</span>
            <span>© {new Date().getFullYear()} IP-6 Research, Inc.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
