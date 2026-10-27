import type { Product, Currency } from "@/types";
import { asset } from "@/lib/assets";

// Every price is set in USD and converted with one rate table so no currency
// can drift from the others. Rates are a fixed snapshot; update them here.
const USD_RATES: Record<Currency, number> = { USD: 1, CAD: 1.37, GBP: 0.8, AUD: 1.51, EUR: 0.92, INR: 83.65 };

/** USD cents in, every supported currency out, rounded to a .99 price (whole rupees for INR). */
export function pricesFromUsd(usdCents: number): Record<Currency, number> {
  const out = {} as Record<Currency, number>;
  for (const [c, rate] of Object.entries(USD_RATES) as [Currency, number][]) {
    const raw = usdCents * rate;
    out[c] = c === "USD" ? usdCents : c === "INR" ? Math.round(raw / 100) * 100 : Math.max(99, Math.round(raw / 100) * 100 - 1);
  }
  return out;
}

// Product photos, served from the S3/CloudFront assets bucket (see lib/assets.ts; sources in assets/products/).
const HERO_SUPPLEMENT = asset("products/supplement-240.png");
// The client's USA 240-count label artwork (Supplement Facts on the right panel).
const DETAIL_SUPPLEMENT_LABEL = asset("products/supplement-240-label.jpg");

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
      "Formulated by Professor Shamsuddin, founder and formulator",
      "Manufactured in a cGMP-certified facility",
      "No magnesium stearate, no silicon dioxide, no unnecessary additives",
      "Hypromellose (vegetable) capsule",
    ],
    ingredients: [
      "IP6 (Calcium Magnesium Inositol Hexaphosphate), 804 mg per 4-capsule serving",
      "Inositol, 196 mg per serving",
      "Other ingredients: hypromellose (vegetable capsule)",
    ],
    howToUse: [
      "Take 4 capsules once or twice daily with water, or as directed by your healthcare professional.",
      "Consult a healthcare professional before starting any supplement regimen.",
    ],
    variants: [
      {
        id: "sup-capsule-240",
        sku: "SUP-IP6-CAP240",
        name: "Capsules",
        format: "Capsule",
        size: "240 count",
        priceCents: pricesFromUsd(4999),
        weightGrams: 150,
        inStock: true,
        servings: 60,
        servingLabel: "4 capsules",
        image: { url: HERO_SUPPLEMENT, alt: "IP6 Original Supplement, 240 capsules. Navy bottle with a gold label reading IP6 Original, Pioneer in IP6 Research and Cellular Health.", width: 870, height: 1160 },
      },
    ],
    subscriptionCycles: [
      { days: 30, discountPct: 15 },
      { days: 90, discountPct: 20 },
    ],
    images: [
      { url: HERO_SUPPLEMENT, alt: "IP6 Original Supplement, 240 vegetarian capsules. Navy bottle with a gold label reading IP6 Original, Pioneer in IP6 Research and Cellular Health.", width: 870, height: 1160 },
      { url: DETAIL_SUPPLEMENT_LABEL, alt: "IP6 Original 240-count label. Supplement Facts: serving size 4 capsules, 60 servings per container, 804 mg calcium magnesium inositol hexaphosphate (IP6) and 196 mg Inositol per serving.", width: 1600, height: 622 },
    ],
    faq: [
      {
        q: "What is IP6?",
        a: "IP6 (inositol hexaphosphate) is a naturally occurring compound found in whole grains, legumes, and seeds. IP6 Original pairs it with Inositol in a high-purity formula, third-party tested for purity, potency, and quality.",
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
  {
    // Facts from the pet 120 g label and the live Shopify product (ip6-original-pet-powder).
    slug: "ip6-original-pet-powder",
    sku: "PET-IP6-PWD120",
    name: "IP6 Original Pet Powder",
    shortDescription:
      "The original IP6 formula, for pets, in an easy-to-mix powder. IP6 and Inositol for dogs and cats, for single and multi-pet households.",
    category: "pet",
    heroClaim: "The original IP6 formula, for pets",
    highlights: [
      "804 mg IP6 and 196 mg Inositol per 1 g level scoop",
      "Unflavored, easy to mix into food",
      "No magnesium stearate, no silicon dioxide, no unnecessary additives",
      "cGMP-certified, third-party tested, veterinarian formulated",
      "Made in USA",
      "Measuring scoop included",
    ],
    ingredients: [
      "IP6 (Inositol Hexaphosphate), 804 mg per 1 g level scoop",
      "Inositol, 196 mg per scoop",
      "Other ingredients: none",
    ],
    howToUse: [
      "Dogs up to 25 lb: 1 level scoop once daily.",
      "Dogs 26 to 50 lb: 1 level scoop twice daily.",
      "Dogs over 50 lb: 2 level scoops twice daily.",
      "Cats: 1 level scoop once daily.",
      "Use the enclosed measuring scoop and mix into your pet's food.",
    ],
    variants: [
      {
        id: "pet-powder-120g",
        sku: "PET-IP6-PWD120",
        name: "Powder",
        format: "Powder",
        size: "120 g",
        priceCents: pricesFromUsd(2999),
        weightGrams: 160,
        inStock: true,
        servings: 120,
        servingLabel: "1 g level scoop",
      },
    ],
    subscriptionCycles: [],
    images: [
      { url: asset("products/pet-powder-120g.png"), alt: "IP6 Original Pet Powder, 120 g tub with a dog and a cat on the label. Unflavored, easy to mix.", width: 870, height: 1160 },
    ],
    faq: [
      {
        q: "How much do I give my pet?",
        a: "Dogs up to 25 lb: 1 level scoop once daily. Dogs 26 to 50 lb: 1 level scoop twice daily. Dogs over 50 lb: 2 level scoops twice daily. Cats: 1 level scoop once daily. Use the enclosed measuring scoop.",
      },
      {
        q: "What is in each scoop?",
        a: "Each 1 g level scoop contains 804 mg IP6 and 196 mg Inositol. There are no other ingredients.",
      },
      {
        q: "Is it flavored?",
        a: "No. It is unflavored and easy to mix into food.",
      },
      {
        q: "Is it third-party tested?",
        a: "Yes. IP6 Original Pet Powder is made in a cGMP-certified facility and third-party tested.",
      },
    ],
    relatedSkus: [],
    requiresDsheaDisclaimer: true,
    shipsGlobally: false,
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
