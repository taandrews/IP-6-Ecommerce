import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Credibility } from "@/components/home/Credibility";
import { Molecule } from "@/components/home/Molecule";
import { Divider } from "@/components/home/MoleculeMark";
import { Stakes } from "@/components/home/Stakes";
import { FounderBand } from "@/components/home/FounderBand";
import { ProductSection } from "@/components/home/ProductSection";
import { HowToTake } from "@/components/home/HowToTake";
import { products } from "@/content/products";
import { resolveCurrency } from "@/lib/currency";
import { formatPrice } from "@/lib/utils";

/**
 * Optional assets, read at render time so the page works before they exist:
 *   /public/bottle/frame-000.webp .. frame-059.webp   bottle rotation sequence
 *   /public/product/macro-*.webp                        product macro shots
 *   /public/founder.mp4                                 founder video
 *   /public/lifestyle-water.webp                        how-to-take lifestyle image
 */
function optionalAssets() {
  const pub = join(process.cwd(), "public");
  const frames: string[] = [];
  for (let i = 0; i < 60; i++) {
    const name = `frame-${String(i).padStart(3, "0")}.webp`;
    if (existsSync(join(pub, "bottle", name))) frames.push(`/bottle/${name}`);
    else break;
  }
  let macros: string[] = [];
  try {
    macros = readdirSync(join(pub, "product"))
      .filter((f) => /^macro-.*\.webp$/i.test(f))
      .sort()
      .map((f) => `/product/${f}`);
  } catch {
    macros = [];
  }
  return {
    frames: frames.length === 60 ? frames : [],
    macros,
    hasFounderVideo: existsSync(join(pub, "founder.mp4")),
    hasLifestyle: existsSync(join(pub, "lifestyle-water.webp")),
  };
}

export default function HomePage() {
  const currency = resolveCurrency();
  const supplement = products.find((p) => p.slug === "ip6-original-supplement")!;
  const supplementFrom = Math.min(...supplement.variants.map((v) => v.priceCents[currency]));
  const assets = optionalAssets();
  const shopHref = `/shop/${supplement.slug}`;

  return (
    <>
      <Hero frames={assets.frames} price={formatPrice(supplementFrom, currency)} shopHref={shopHref} />
      <Credibility />
      <Molecule />
      <Stakes />
      <FounderBand hasVideo={assets.hasFounderVideo} />
      <ProductSection product={supplement} currency={currency} macros={assets.macros} />
      {/* @sections */}
      <Footer showDshea />
    </>
  );
}
