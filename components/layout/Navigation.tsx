"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User, Search, X } from "lucide-react";
import { useCart } from "@/components/cart/CartStore";
import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/shop/ip6-original-supplement", label: "IP6 Original" },
  { href: "/story", label: "The Story" },
  { href: "/the-difference", label: "The Difference" },
  { href: "/faq", label: "FAQ" },
];

/**
 * Fixed 64px header. Transparent over the home hero, navy once the page
 * scrolls (or on every other page). The announcement bar above it is 56px,
 * so the header sits at top-14.
 */
export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openDrawer, count } = useCart();
  const pathname = usePathname();
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = true; // header text is always cream: transparent-over-navy or solid navy
  const iconBtn = "p-2 rounded-md hover:bg-surface/10 text-cream";

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-14 z-40 h-16 transition-colors duration-300",
        overHero ? "bg-transparent" : "bg-navy-800 border-b border-surface/10",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="IP6 Original, Home" className="block">
          <Image
            src="/brand/ip6-original-logo.png"
            alt="IP6 Original"
            width={324}
            height={216}
            priority
            className={cn("h-10 w-auto", dark && "brightness-0 invert")}
          />
        </Link>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[12px] uppercase tracking-[0.12em] text-cream/85 hover:text-gold-400"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 text-cream">
          <Link href="/shop?search=1" aria-label="Search" className={cn(iconBtn, "hidden sm:inline-flex")}>
            <Search className="size-5" />
          </Link>
          <CurrencySwitcher />
          <Link href="/account" aria-label="Account" className={iconBtn}>
            <User className="size-5" />
          </Link>
          <button onClick={openDrawer} aria-label={`Cart (${count} items)`} className={cn(iconBtn, "relative")}>
            <ShoppingBag className="size-5" />
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 grid place-items-center size-4 text-[10px] font-bold text-navy-900 bg-gold-400 rounded-full">
                {count}
              </span>
            ) : null}
          </button>
          <button onClick={() => setMobileOpen(true)} aria-label="Menu" className={cn(iconBtn, "lg:hidden")}>
            <Menu className="size-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 overflow-hidden transition-[opacity,visibility]",
          mobileOpen ? "pointer-events-auto opacity-100 visible" : "pointer-events-none opacity-0 invisible",
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-full max-w-xs bg-navy-800 text-cream shadow-card p-6 transition-transform duration-300 ease-brand flex flex-col",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between mb-8">
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400">Menu</span>
            <button onClick={() => setMobileOpen(false)} className="p-2" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 border-b border-surface/15 text-lg"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/account" onClick={() => setMobileOpen(false)} className="py-3 mt-4 font-mono text-[12px] uppercase tracking-[0.12em] text-gold-400">
              Account
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
