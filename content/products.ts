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
    heroClaim: "Veterinarian formulated",
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
        priceCents: { USD: 3400, CAD: 4700, GBP: 2700, AUD: 5100, EUR: 3100, INR: 284400 },
        weightGrams: 160,
        inStock: true,
      },
    ],
    subscriptionCycles: [],
    images: [
      { url: "/products/pet-powder-120g.jpg", alt: "IP6 Original Pet Powder, 120 g tub with a dog and a cat on the label. Unflavored, easy to mix.", width: 1100, height: 1375 },
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
