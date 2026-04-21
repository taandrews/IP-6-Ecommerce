"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag, User, Search, X } from "lucide-react";
import { useCart } from "@/components/cart/CartStore";
import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { Wordmark } from "@/components/layout/Wordmark";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/why-ip6", label: "Why IP6" },
  { href: "/how-to-take", label: "How to Take" },
  { href: "/savings", label: "Savings & Support" },
  { href: "/lifestyle", label: "Lifestyle" },
  { href: "/faq", label: "FAQs" },
  { href: "/shop", label: "Shop" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openDrawer, count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-ivory-300/80 bg-surface/90 backdrop-blur">
      <div className="container flex items-center justify-between h-16 lg:h-20">
        <Link href="/" aria-label="IP-6 Research — Home" className="block">
          <Wordmark size="sm" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink/80 hover:text-forest-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/shop?search=1"
            aria-label="Search"
            className="p-2 rounded-md hover:bg-ivory-200 hidden sm:inline-flex"
          >
            <Search className="size-5" />
          </Link>
          <CurrencySwitcher />
          <Link
            href="/account"
            aria-label="Account"
            className="p-2 rounded-md hover:bg-ivory-200"
          >
            <User className="size-5" />
          </Link>
          <button
            onClick={openDrawer}
            aria-label={`Cart (${count} items)`}
            className="relative p-2 rounded-md hover:bg-ivory-200"
          >
            <ShoppingBag className="size-5" />
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 grid place-items-center size-4 text-[10px] font-bold text-ivory-100 bg-forest-700 rounded-full">
                {count}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="p-2 rounded-md hover:bg-ivory-200 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-opacity",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-full max-w-xs bg-surface shadow-card p-6 transition-transform duration-300 ease-brand flex flex-col",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between mb-8">
            <span className="font-display text-xl text-forest-800">Menu</span>
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
                className="py-3 border-b border-ivory-300 text-lg text-forest-800"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="py-3 mt-4 text-forest-700 font-medium"
            >
              Account
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
