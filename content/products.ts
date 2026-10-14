import type { Product } from "@/types";
import { asset } from "@/lib/assets";

// Product photos, served from /public/products/.
const HERO_SUPPLEMENT = "/products/supplement-real.png";
const DETAIL_SUPPLEMENT_BACK = "/products/supplement-real-back.png";

const DETAIL_SUPPLEMENT_2 = asset("products/supplement-2.jpg");
const DETAIL_SUPPLEMENT_3 = asset("products/supplement-3.jpg");



export const products: Product[] = [
  {
    slug: "ip6-original-supplement",
    sku: "SUP-IP6-BASE",
    name: "IP6 Original Supplement",
    shortDescription:
      "The original IP6 formula, a high-purity blend of IP6 and Inositol, formulated by the physician-scientist who pioneered the research behind it.",
    category: "supplement",
    heroClaim: "High-purity formula",
    highlights: [
      "High-Purity Formula, third-party tested",
      "Formulated by Prof. Shamsuddin, founder and formulator",
      "Manufactured in a cGMP-certified facility",
      "No magnesium stearate, no silicon dioxide, no unnecessary additives",
      "Plant-based capsule (cellulose)",
    ],
    ingredients: [
      "IP6 (Calcium-Magnesium Inositol Hexaphosphate), 804 mg per 2-capsule serving",
      "Inositol, 196 mg per serving",
      "Other ingredients: plant-based capsule (cellulose)",
    ],
    howToUse: [
      "Take 2 capsules once or twice daily with water, or as directed by your healthcare professional.",
      "For best absorption, take on an empty stomach when possible.",
      "Consult a healthcare professional before starting any supplement regimen.",
    ],
    variants: [
      {
        id: "sup-capsule-120",
        sku: "SUP-IP6-CAP120",
        name: "Capsules",
        format: "Capsule",
        size: "120 count",
        priceCents: { USD: 4900, CAD: 6700, GBP: 3900, AUD: 7400, EUR: 4500, INR: 409900 },
        weightGrams: 150,
        inStock: true,
      },
      {
        id: "sup-capsule-60",
        sku: "SUP-IP6-CAP60",
        name: "Capsules",
        format: "Capsule",
        size: "60 count",
        priceCents: { USD: 2900, CAD: 4000, GBP: 2300, AUD: 4400, EUR: 2700, INR: 242600 },
        weightGrams: 95,
        inStock: true,
      },
    ],
    subscriptionCycles: [
      { days: 30, discountPct: 15 },
      { days: 90, discountPct: 20 },
    ],
    images: [
      { url: HERO_SUPPLEMENT, alt: "IP6 Original Supplement. Navy bottle with gold accents reading 'IP6 ORIGINAL · Pioneer in IP6 Research and Cellular Health · Dr. Shamsuddin'.", width: 652, height: 1356 },
      { url: DETAIL_SUPPLEMENT_BACK, alt: "IP6 Original Supplement back label. Supplement Facts panel with serving size and amounts per 2-capsule serving, 60 servings per container, plus suggested use, ingredients, and cGMP Certified / Third-Party Tested / High-Purity Formula badges.", width: 674, height: 912 },
    ],
    faq: [
      {
        q: "What is IP6?",
        a: "IP6 (inositol hexaphosphate) is a naturally occurring compound found in whole grains, legumes, and seeds. IP6 Original pairs it with Inositol in a high-purity formula, third-party tested for purity, potency, and quality.",
      },
      {
        q: "Why take IP6 between meals?",
        a: "Take IP6 on an empty stomach, away from mineral-rich meals, for the best absorption.",
      },
      {
        q: "Is this product third-party tested?",
        a: "Yes. IP6 Original is independently third-party tested for purity, potency, and quality.",
      },
      {
        q: "Can I take IP6 with other supplements?",
        a: "IP6 is commonly taken alongside other wellness routines. We recommend consulting your healthcare professional to coordinate any supplement stack.",
      },
    ],
    relatedSkus: [],
    requiresDsheaDisclaimer: true,
    shipsGlobally: false,
    // labReport: add back once the real certificate of analysis PDF is in public/coa/
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsBySkus(skus: string[]) {
  return products.filter((p) => skus.includes(p.sku));
}

export function getStartingPriceCents(product: Product, currency: keyof Product["variants"][number]["priceCents"] = "USD") {
  const prices = product.variants.map((v) => v.priceCents[currency]);
  return Math.min(...prices);
}
