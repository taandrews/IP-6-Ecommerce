"use client";

import { useState } from "react";
import { asset } from "@/lib/assets";
import Link from "next/link";
import { Menu, ShoppingBag, User, Search, X } from "lucide-react";
import { useCart } from "@/components/cart/CartStore";
import { CurrencySwitcher, CurrencyMenu } from "@/components/layout/CurrencySwitcher";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SHOP_LINKS = [
  { href: "/shop/ip6-original-supplement", label: "Supplement for people" },
  { href: "/shop/ip6-original-pet-powder", label: "Powder for pets" },
];

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/story", label: "The Story" },
  { href: "/the-difference", label: "The Difference" },
  { href: "/faq", label: "FAQ" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openDrawer, count } = useCart();

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-ivory-300/80 bg-surface/90 backdrop-blur">
      <div className="container flex items-center justify-between h-16 lg:h-20">
        <Link href="/" aria-label="IP6 Original, Home" className="block">
          <Image src={asset("brand/ip6-original-logo.png")} alt="IP6 Original" width={324} height={216} priority className="h-11 lg:h-14 w-auto" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-base font-semibold text-navy-800 hover:text-gold-700"
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

    </header>

      {/* Mobile drawer: outside the header, because backdrop-blur makes the header the containing block for fixed children */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 overflow-hidden transition-opacity",
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
          <nav className="flex flex-col gap-1 overflow-y-auto">
            {LINKS.map((l) => (
              <div key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 border-b border-ivory-300 text-lg font-semibold text-navy-800"
                >
                  {l.label}
                </Link>
                {l.href === "/shop"
                  ? SHOP_LINKS.map((sl) => (
                      <Link
                        key={sl.href}
                        href={sl.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2.5 pl-4 border-b border-ivory-300 text-base text-forest-700"
                      >
                        {sl.label}
                      </Link>
                    ))
                  : null}
              </div>
            ))}
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="py-3 mt-4 text-forest-700 font-medium"
            >
              Account
            </Link>
            <div className="mt-6 pt-6 border-t border-ivory-300">
              <CurrencyMenu />
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
