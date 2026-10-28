"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import type { Currency, Product } from "@/types";
import { PurchasePanel } from "./PurchasePanel";
import { PetHero } from "./PetHero";
import { SupplementHero } from "./SupplementHero";
import { LIFESTYLE } from "@/lib/cdn-images";
const { supplementMain, supplementDetail, supplementUse, supplementRoutine, petMain, petDetail, petUse, petRoutine } = LIFESTYLE;
import styles from "./ProductDetail.module.css";

export function ProductDetail({ product, currency }: { product: Product; currency: Currency }) {
  const pet = product.category === "pet";
  const facts = useRef<HTMLDetailsElement>(null);
  const directions = useRef<HTMLDetailsElement>(null);
  const photos = pet ? [petMain, petDetail, petUse, petRoutine] as const : [supplementMain, supplementDetail, supplementUse, supplementRoutine] as const;
  const alts = pet ? [
    "IP6 Original Pet Powder on a kitchen counter beside a scoop and food bowl",
    "IP6 powder and measuring scoop beside the open container",
    "Powder being added to a bowl of pet food",
    "Dog and cat eating from separate bowls, with IP6 Original Pet Powder on a nearby shelf",
  ] as const : [
    "IP6 Original 240-capsule bottle with capsules and a glass of water",
    "Vegetable capsules on a white dish beside the IP6 Original bottle",
    "Four capsules in an open palm beside a glass of water",
    "Open IP6 Original bottle, resting lid, four capsules and a glass of water",
  ] as const;
  function openDetails(ref: typeof facts) {
    if (!ref.current) return;
    ref.current.open = true;
    ref.current.scrollIntoView({ block: "center", behavior: "smooth" });
    ref.current.querySelector("summary")?.focus({ preventScroll: true });
  }
  return <div className={styles.page}>
    {pet && <PetHero />}
    {product.slug === "ip6-original-supplement" && <SupplementHero />}
    <div className={styles.container}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/shop">Shop</Link><span aria-hidden="true">/</span><span>{product.name}</span></nav>
      <div className={styles.topGrid} id={pet ? "pet-product" : undefined}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>{pet ? "For dogs & cats" : "For people"}</p>
          <h1>IP6 Original<br />{pet ? "Pet Powder" : "Supplement"}</h1>
          <p className={styles.description}>{pet ? "Unflavored IP6 and Inositol powder for dogs and cats." : "IP6 and Inositol in vegetable capsules."}</p>
          <button className={styles.textLink} type="button" onClick={() => openDetails(facts)}>{pet ? "View product details" : "View Supplement Facts"}<ArrowRight size={18} aria-hidden="true" /></button>
        </header>
        <figure className={styles.gallery}>
          <Image src={photos[0].src} width={photos[0].width} height={photos[0].height} alt={alts[0]} priority sizes="(min-width: 900px) 55vw, 100vw" />
          <div className={styles.photoPair}>
            <Image src={photos[1].src} width={photos[1].width} height={photos[1].height} alt={alts[1]} sizes="(min-width: 900px) 28vw, 50vw" />
            <Image src={photos[2].src} width={photos[2].width} height={photos[2].height} alt={alts[2]} sizes="(min-width: 900px) 28vw, 50vw" />
          </div>
          <figcaption>Concept photography</figcaption>
        </figure>
        <div className={styles.buyColumn} id={pet ? "pet-purchase" : product.slug === "ip6-original-supplement" ? "supplement-purchase" : undefined} style={pet || product.slug === "ip6-original-supplement" ? { scrollMarginTop: "110px" } : undefined}>
          <PurchasePanel product={product} currency={currency} presentation="editorial" />
          <div className={styles.accordions}>
            <details><summary>Ingredients<Plus size={20} aria-hidden="true" /></summary><ul>{product.ingredients?.map(item => <li key={item}>{item}</li>)}</ul></details>
            <details ref={directions} id="how-to-use"><summary>{pet ? "Feeding directions" : "How to take"}<Plus size={20} aria-hidden="true" /></summary><ul>{product.howToUse.map(item => <li key={item}>{item}</li>)}</ul>{!pet && <Link className={styles.textLink} href="/how-to-take">Full directions<ArrowRight size={16} /></Link>}</details>
            <details ref={facts} id="product-details"><summary>Product details<Plus size={20} aria-hidden="true" /></summary>
              <p>{product.shortDescription}</p>
              <ul>{product.highlights.map(item => <li key={item}>{item}</li>)}</ul>
              {!pet && product.images[1] && <a className={styles.labelLink} href={product.images[1].url} target="_blank" rel="noopener noreferrer"><Image src={product.images[1].url} alt={product.images[1].alt} width={product.images[1].width} height={product.images[1].height} sizes="(min-width: 900px) 40vw, 100vw" /><span>Open full-size Supplement Facts label ↗</span></a>}
              {product.labReport && <a className={styles.textLink} href={product.labReport.url}>View certificate of analysis<ArrowRight size={16} /></a>}
            </details>
          </div>
        </div>
      </div>
    </div>
    <section className={styles.routine} aria-labelledby="routine-heading"><div className={styles.container}>
      <h2 id="routine-heading">A closer look at {pet ? "their" : "your"} daily routine.</h2>
      <div className={styles.routineGrid}>
        <Image src={photos[3].src} width={photos[3].width} height={photos[3].height} alt={alts[3]} sizes="(min-width: 900px) 55vw, 100vw" />
        <div><h3>IP6 + Inositol</h3><p>804 mg IP6 and 196 mg Inositol<br />per {pet ? "1 g level scoop" : "4-capsule serving"}.</p>{pet && <p>Mix into food. Follow the feeding directions for your pet.</p>}<button className={styles.textLink} onClick={() => openDetails(directions)}>{pet ? "Feeding directions" : "How to take"}<ArrowRight size={18} /></button></div>
      </div>
    </div></section>
    <section className={`${styles.container} ${styles.faq}`} aria-labelledby="product-faq"><h2 id="product-faq">A few things to know.</h2><div className={styles.accordions}>{product.faq.map(item => <details key={item.q}><summary>{item.q}<Plus size={20} aria-hidden="true" /></summary><p>{item.a}</p></details>)}</div></section>
  </div>;
}
