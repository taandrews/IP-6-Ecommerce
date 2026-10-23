"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { Product, Currency } from "@/types";
import type { PreorderSettings } from "@/types/records";
import { ProductCard } from "@/components/product/ProductCard";

/** Words a shopper might type that are not in the product copy. */
const SYNONYMS: Record<Product["category"], string[]> = {
  supplement: ["human", "humans", "people", "person", "adult", "adults", "capsule", "capsules", "tablet", "tablets", "pill", "pills", "bottle"],
  pet: ["pet", "pets", "dog", "dogs", "cat", "cats", "animal", "animals", "powder", "scoop", "veterinarian", "vet"],
  skincare: ["skin", "cream"],
  filter: ["water", "filter"],
};

const STOP = new Set(["the", "a", "an", "of", "for", "and", "to", "buy", "order", "pre", "preorder", "pre-order", "shop"]);

function haystack(p: Product) {
  return [p.name, p.shortDescription, p.heroClaim, ...p.highlights, ...SYNONYMS[p.category], ...p.variants.map((v) => v.size ?? "")]
    .join(" ")
    .toLowerCase();
}

function score(p: Product, query: string) {
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));
  if (!tokens.length) return 1;
  const hay = haystack(p);
  return tokens.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
}

/**
 * The collection with a search box and the two product lines kept apart:
 * people first, pets second, each under its own heading so nobody has to
 * guess which bottle is for whom.
 */
export function ShopCatalog({ products, currency, preorder }: { products: Product[]; currency: Currency; preorder: PreorderSettings }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // The header's search icon lands here with ?search=1 and the box ready to type in.
  useEffect(() => {
    if (params.get("search") === "1") inputRef.current?.focus();
  }, [params]);

  const matched = useMemo(() => {
    const scored = products.map((p) => ({ p, s: score(p, q) })).filter((x) => x.s > 0);
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.p);
  }, [products, q]);

  const groups: { id: string; label: string; intro: string; items: Product[] }[] = [
    { id: "people", label: "For people", intro: "IP6 and Inositol in vegetable capsules.", items: matched.filter((p) => p.category === "supplement") },
    { id: "pets", label: "For pets", intro: "The same IP6 and Inositol as an unflavored powder for dogs and cats.", items: matched.filter((p) => p.category === "pet") },
    { id: "other", label: "More", intro: "", items: matched.filter((p) => p.category !== "supplement" && p.category !== "pet") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="container pb-20">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative max-w-xl mx-auto mb-12">
        <label htmlFor="shop-search" className="sr-only">Search products</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-ink/50" aria-hidden />
        <input
          ref={inputRef}
          id="shop-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: IP6 Original, pet powder, capsules"
          className="input pl-12 pr-11 py-3.5 text-base"
          autoComplete="off"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-cloud-200">
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      {groups.length === 0 ? (
        <p className="text-center text-ink/70">
          Nothing matches &ldquo;{q}&rdquo;. We sell two products: IP6 Original Supplement for people and IP6 Original Pet Powder for dogs and cats.
        </p>
      ) : null}

      <div className="space-y-16">
        {groups.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`shop-${g.id}`} className="scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-6 border-b border-cloud-300 pb-3">
              <h2 id={`shop-${g.id}`} className="font-display text-2xl lg:text-3xl text-navy-800 whitespace-nowrap">{g.label}</h2>
              {g.intro ? <p className="text-sm text-ink/65">{g.intro}</p> : null}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {g.items.map((p) => (
                <ProductCard key={p.sku} product={p} currency={currency} preorder={preorder} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
