"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import type { Product, Currency, Review } from "@/types";
import type { PreorderSettings } from "@/types/records";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { Reviews } from "@/components/product/Reviews";
import { DsheaDisclaimer } from "@/components/product/Dshea";
import { LIFESTYLE } from "@/lib/cdn-images";
const { supplementMain: supplementPhoto, petFeeding: petPhoto, supplementDetail, supplementUse, petDetail, petUse } = LIFESTYLE;
import styles from "./ShopCatalog.module.css";

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
export function ShopCatalog({ products, currency, preorder, reviewsBySku = {} }: { products: Product[]; currency: Currency; preorder: PreorderSettings; reviewsBySku?: Record<string, Review[]> }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<Product["category"] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Product links always reveal their destination, including when a filter was active.
  useEffect(() => {
    const revealProduct = (id = window.location.hash.slice(1)) => {
      if (id !== "people" && id !== "pets") return;
      setQ("");
      setCategory(null);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    const onHashChange = () => revealProduct();
    const onProductLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === "/shop") revealProduct(url.hash.slice(1));
    };
    revealProduct();
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onProductLink);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onProductLink);
    };
  }, []);

  // The header's search icon lands here with ?search=1 and the box ready to type in.
  useEffect(() => {
    if (params.get("search") === "1") inputRef.current?.focus();
  }, [params]);

  const matched = useMemo(() => {
    const scored = products.filter((p) => category === null || p.category === category).map((p) => ({ p, s: score(p, q) })).filter((x) => x.s > 0);
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.p);
  }, [products, q, category]);

  const groups: { id: string; label: string; items: Product[] }[] = [
    { id: "people", label: "For people", items: matched.filter((p) => p.category === "supplement") },
    { id: "pets", label: "For pets", items: matched.filter((p) => p.category === "pet") },
    { id: "other", label: "More", items: matched.filter((p) => p.category !== "supplement" && p.category !== "pet") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className={styles.catalog}>
      <header className={styles.heading}><h2>Choose your formula</h2><p>Product details and ordering, all in one place.</p></header>
      <div className={styles.toolbar}>
        <nav aria-label="Product categories" className={styles.categories}>
          <button type="button" aria-pressed={category === null} aria-controls="shop-products" onClick={() => setCategory(null)}>All</button>
          <button type="button" aria-pressed={category === "supplement"} aria-controls="shop-products" onClick={() => setCategory("supplement")}>For people</button>
          <button type="button" aria-pressed={category === "pet"} aria-controls="shop-products" onClick={() => setCategory("pet")}>For pets</button>
        </nav>
      <form role="search" onSubmit={(e) => e.preventDefault()} className={styles.search}>
        <label htmlFor="shop-search" className="sr-only">Search products</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-ink/50" aria-hidden />
        <input
          ref={inputRef}
          id="shop-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products"
          className={styles.searchInput}
          autoComplete="off"
        />
        {q ? (
          <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear search" className={styles.clearSearch}>
            <X className="size-4" />
          </button>
        ) : null}
      </form>
        <p role="status" className={styles.resultCount}>{matched.length} {matched.length === 1 ? "product" : "products"}</p>
      </div>

      {groups.length === 0 ? (
        <div className={styles.empty}>
          <h2>No products found</h2>
          <p>{q ? <>Nothing matches &ldquo;{q}&rdquo;{category ? " in this category" : ""}. Try another search or choose All.</> : "No products are available in this category."}</p>
          <button type="button" onClick={() => { setQ(""); setCategory(null); inputRef.current?.focus(); }} className={styles.details}>Show all products <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      ) : null}

      <div id="shop-products" className={styles.productGrid}>
        {groups.map((g) => (
          <section key={g.id} id={g.id} aria-label={g.label} className={styles.group}>
              {g.items.map((p) => (
                <ShopProductRow key={p.sku} product={p} audience={g.label} currency={currency} preorder={preorder} reviews={reviewsBySku[p.sku] ?? []} />
              ))}
          </section>
        ))}
      </div>
      <p className={styles.collectionNote}>Concept photography.</p>
      <DsheaDisclaimer className={styles.disclaimer} />
    </div>
  );
}

function ShopProductRow({ product, audience, currency, preorder, reviews }: { product: Product; audience: string; currency: Currency; preorder: PreorderSettings; reviews: Review[] }) {
  const pet = product.category === "pet";
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = pet ? [petPhoto, petDetail, petUse] : [supplementPhoto, supplementDetail, supplementUse];
  const alts = pet ? ["IP6 Original Pet Powder beside a food bowl, with a dog and cat in a bright feeding area", "IP6 Original powder with its measuring scoop", "IP6 Original powder being added to pet food"] : ["IP6 Original Supplement with capsules and water", "Vegetable capsules beside the IP6 Original bottle", "Four capsules in an open palm beside a glass of water"];
  const description = pet ? "Unflavored IP6 and Inositol powder for dogs and cats." : "IP6 and Inositol in vegetable capsules.";
  return <article className={styles.productRow} aria-labelledby={`title-${product.slug}`}>
    <div className={styles.cardTop}><p className={styles.eyebrow}>{pet ? "For dogs & cats" : audience}</p>{preorder.active && preorder.discountPct > 0 && <span className={styles.offer}>{preorder.discountPct}% launch offer</span>}</div>
    <header className={styles.productCopy}>
      <h3 id={`title-${product.slug}`}>{product.name}</h3>
      <p className={styles.description}>{description}</p>
    </header>
    <div className={styles.photo}>
      <Image src={(photos[photoIndex] ?? photos[0]!).src} width={(photos[photoIndex] ?? photos[0]!).width} height={(photos[photoIndex] ?? photos[0]!).height} alt={alts[photoIndex] ?? product.name} sizes="(max-width: 700px) 100vw, 50vw" priority={photoIndex === 0} />
    </div>
    <div className={styles.thumbnails} role="group" aria-label={`${product.name} photos`}>
      {photos.map((photo, index) => <button key={photo.src} type="button" aria-label={`Show ${["product", "close-up", "in-use"][index]} photo`} aria-pressed={photoIndex === index} onClick={() => setPhotoIndex(index)}><Image src={photo.src} alt="" width={72} height={60} sizes="72px" /></button>)}
    </div>
    <div className={styles.buy} id={pet ? "pets-purchase" : "people-purchase"}><PurchasePanel product={product} currency={currency} presentation="catalog" /></div>
    <div className={styles.accordions}>
      <details><summary>Ingredients &amp; {pet ? "product details" : "Supplement Facts"}<Plus size={18} aria-hidden="true" /></summary>
        <ul>{product.ingredients?.map(item => <li key={item}>{item}</li>)}</ul>
        <ul>{product.highlights.map(item => <li key={item}>{item}</li>)}</ul>
        {!pet && product.images[1] && <a className={styles.label} href={product.images[1].url} target="_blank" rel="noopener noreferrer"><Image src={product.images[1].url} alt={product.images[1].alt} width={product.images[1].width} height={product.images[1].height} sizes="(max-width: 700px) 100vw, 50vw" /><span>Open full-size Supplement Facts label</span></a>}
        {product.labReport && <a href={product.labReport.url} className={styles.details}>View certificate of analysis <ArrowRight size={16} aria-hidden="true" /></a>}
      </details>
      <details><summary>{pet ? "Feeding directions" : "How to take"}<Plus size={18} aria-hidden="true" /></summary><ol>{product.howToUse.map(item => <li key={item}>{item}</li>)}</ol>{!pet && <Link href="/how-to-take" className={styles.details}>Full directions <ArrowRight size={16} aria-hidden="true" /></Link>}</details>
      <details><summary>Frequently asked questions<Plus size={18} aria-hidden="true" /></summary><dl className={styles.faq}>{product.faq.map(item => <div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>)}</dl></details>
      <details><summary>Customer reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}<Plus size={18} aria-hidden="true" /></summary><Reviews sku={product.sku} initial={reviews} compact /></details>
    </div>
  </article>;
}
