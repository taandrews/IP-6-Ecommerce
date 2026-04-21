import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, Phone, Package, RefreshCw, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { products } from "@/content/products";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Savings & Support",
  description:
    "Save up to 20% with subscriptions. Bundle pricing, replacement cartridge auto-ship, and customer support resources.",
  alternates: hreflangAlternates("/savings"),
};

export default function SavingsPage() {
  const currency = resolveCurrency();
  const supplement = products.find((p) => p.category === "supplement")!;
  const supplementFrom = Math.min(...supplement.variants.map((v) => v.priceCents[currency]));
  const subSaving = formatPrice(Math.round(supplementFrom * 0.8), currency);

  return (
    <>
      <section className="bg-cloud-100 border-b border-cloud-300 py-14 lg:py-20">
        <div className="container max-w-4xl">
          <p className="eyebrow">Savings & Support</p>
          <h1 className="font-sans font-semibold text-navy-800 text-balance mt-4" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            Save up to 20%.<br />Cancel anytime.
          </h1>
          <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-3xl">
            Subscriptions deliver to your chosen cycle so you don&apos;t lapse. Bundles add an additional 5–10% on multi-product orders.
          </p>
        </div>
      </section>

      {/* Two large pricing tiles */}
      <section className="container py-16 lg:py-20 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-surface border-2 border-sky-500 rounded-lg p-8 lg:p-10 relative">
            <span className="absolute -top-3 left-8 bg-sky-600 text-surface text-[11px] uppercase tracking-[0.22em] font-semibold px-3 py-1 rounded">
              Most popular
            </span>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">
              Subscribe & save
            </p>
            <p className="font-sans font-bold text-navy-800 mt-3" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {subSaving}<span className="text-base text-ink/60 font-normal">/order at 20% off</span>
            </p>
            <p className="mt-4 text-ink/75">
              IP6 Original Supplement at the 90-day cycle. Maximum savings.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink/85">
              {[
                "20% off every order, automatically",
                "Skip, pause, or cancel from your account",
                "Free standard shipping on every renewal",
                "First-renewal price-lock for 12 months",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-sky-600 mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <Link href={`/shop/${supplement.slug}`} className="btn-primary w-full justify-center mt-8">
              Start a subscription
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="bg-surface border border-cloud-300 rounded-lg p-8 lg:p-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">
              One-time
            </p>
            <p className="font-sans font-bold text-navy-800 mt-3" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {formatPrice(supplementFrom, currency)}<span className="text-base text-ink/60 font-normal">/order</span>
            </p>
            <p className="mt-4 text-ink/75">
              IP6 Original Supplement at full price. No commitment.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink/85">
              {[
                "No subscription required",
                "Free standard shipping over $50",
                "30-day return window",
                "Same product, same testing",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-ink/40 mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <Link href={`/shop/${supplement.slug}`} className="btn-secondary w-full justify-center mt-8">
              Buy once
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cycle table */}
      <section className="bg-cloud-200 py-16 border-y border-cloud-300">
        <div className="container max-w-5xl">
          <h2 className="font-sans font-semibold text-navy-800 text-balance mb-8" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
            Subscription cycles.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { pct: "15%", cycle: "Every 30 days", note: "Daily users, never run low" },
              { pct: "18%", cycle: "Every 60 days", note: "Most popular cycle" },
              { pct: "20%", cycle: "Every 90 days", note: "Biggest per-bottle savings" },
            ].map((c) => (
              <div key={c.cycle} className="bg-surface rounded-lg border border-cloud-300 p-6">
                <p className="font-sans font-bold text-navy-800 leading-none" style={{ fontSize: "2.75rem", letterSpacing: "-0.03em" }}>
                  {c.pct}
                </p>
                <p className="mt-3 text-sm font-semibold text-navy-800">{c.cycle}</p>
                <p className="text-xs text-ink/60 mt-1">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support icons */}
      <section className="container py-16 lg:py-20 max-w-5xl">
        <h2 className="font-sans font-semibold text-navy-800 text-balance mb-10" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
          Your support resources.
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Mail, t: "Order updates", b: "Confirmations, ship notifications, and renewal reminders to your inbox.", link: "/account" },
            { icon: Phone, t: "Customer support", b: "Email response within one business day. Phone available for active subscribers.", link: "/contact" },
            { icon: Package, t: "Pharmacy-style shipping", b: "Tracked, discreet packaging worldwide. Free standard shipping over $50.", link: "/international-shipping" },
            { icon: RefreshCw, t: "Manage anytime", b: "Skip, pause, change frequency, or cancel directly from your account dashboard.", link: "/account" },
          ].map((c) => (
            <Link key={c.t} href={c.link} className="group bg-surface border border-cloud-300 rounded-lg p-6 hover:border-sky-400 transition-colors block">
              <c.icon className="size-5 text-sky-600 mb-4" />
              <h3 className="font-sans font-semibold text-navy-800 text-lg mb-2">{c.t}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{c.b}</p>
              <span className="mt-4 text-xs uppercase tracking-[0.22em] text-sky-700 group-hover:text-sky-800 inline-flex items-center gap-1 font-semibold">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav aria-label="Continue" className="container max-w-3xl mb-20 pt-6 border-t border-cloud-300">
        <Link href="/lifestyle" className="group flex items-center justify-between text-navy-800 hover:text-sky-700 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55 font-semibold">Next</p>
            <p className="font-sans font-semibold text-lg mt-1">Lifestyle</p>
          </div>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </nav>

      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}
