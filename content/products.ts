import type { Product } from "@/types";

const HERO_SUPPLEMENT =
  "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1600&auto=format&fit=crop";
const HERO_CREAM =
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1600&auto=format&fit=crop";
const HERO_FILTER =
  "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=1600&auto=format&fit=crop";

const DETAIL_SUPPLEMENT_2 =
  "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1600&auto=format&fit=crop";
const DETAIL_SUPPLEMENT_3 =
  "https://images.unsplash.com/photo-1550572017-edd951b55104?q=80&w=1600&auto=format&fit=crop";

const DETAIL_CREAM_2 =
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1600&auto=format&fit=crop";
const DETAIL_CREAM_3 =
  "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?q=80&w=1600&auto=format&fit=crop";

const DETAIL_FILTER_2 =
  "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1600&auto=format&fit=crop";
const DETAIL_FILTER_3 =
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1600&auto=format&fit=crop";

export const products: Product[] = [
  {
    slug: "ip6-original-supplement",
    sku: "SUP-IP6-BASE",
    name: "IP6 Original Supplement",
    shortDescription:
      "Pharmaceutical-grade inositol hexaphosphate at 95%+ purity, manufactured to research-grade specifications.",
    category: "supplement",
    heroClaim: "95%+ purity",
    highlights: [
      "95%+ purity IP6 (inositol hexaphosphate)",
      "Supports immune health and healthy cell function",
      "Manufactured in a cGMP-certified facility",
      "Third-party tested for purity and heavy metals",
      "Vegan, non-GMO, gluten-free",
    ],
    ingredients: [
      "Inositol hexaphosphate (IP6), 500 mg",
      "Vegetable cellulose (capsule)",
      "Rice flour",
      "No artificial colors, flavors, or preservatives",
    ],
    howToUse: [
      "Take 2 capsules daily, between meals, with 8 oz of water.",
      "For best absorption, take on an empty stomach when possible.",
      "Consult a healthcare professional before starting any supplement regimen.",
    ],
    variants: [
      {
        id: "sup-capsule-60",
        sku: "SUP-IP6-CAP-60",
        name: "Capsules",
        format: "Capsule",
        size: "60 count",
        priceCents: { USD: 4900, CAD: 6700, GBP: 3900, AUD: 7400, EUR: 4500, INR: 409900 },
        weightGrams: 95,
        inStock: true,
      },
      {
        id: "sup-capsule-120",
        sku: "SUP-IP6-CAP-120",
        name: "Capsules",
        format: "Capsule",
        size: "120 count",
        priceCents: { USD: 8900, CAD: 12200, GBP: 7100, AUD: 13500, EUR: 8200, INR: 744900 },
        weightGrams: 150,
        inStock: true,
      },
      {
        id: "sup-powder-150g",
        sku: "SUP-IP6-PWD-150",
        name: "Powder",
        format: "Powder",
        size: "150 g",
        priceCents: { USD: 7900, CAD: 10800, GBP: 6300, AUD: 12000, EUR: 7300, INR: 661000 },
        weightGrams: 170,
        inStock: true,
      },
      {
        id: "sup-refill-300g",
        sku: "SUP-IP6-RFL-300",
        name: "Refill",
        format: "Refill pouch",
        size: "300 g",
        priceCents: { USD: 13900, CAD: 19000, GBP: 11000, AUD: 21000, EUR: 12800, INR: 1163000 },
        weightGrams: 320,
        inStock: true,
      },
    ],
    subscriptionCycles: [
      { days: 30, discountPct: 15 },
      { days: 90, discountPct: 20 },
    ],
    images: [
      { url: HERO_SUPPLEMENT, alt: "IP6 Original Supplement bottle on a neutral studio backdrop.", width: 1600, height: 1200 },
      { url: DETAIL_SUPPLEMENT_2, alt: "IP6 capsules arranged beside the amber glass bottle.", width: 1600, height: 1200 },
      { url: DETAIL_SUPPLEMENT_3, alt: "Close-up of IP6 powder texture in a glass dish.", width: 1600, height: 1200 },
    ],
    faq: [
      {
        q: "What is IP6?",
        a: "IP6 (inositol hexaphosphate) is a naturally occurring compound found in whole grains, legumes, and seeds. Our formulation delivers 95%+ purity IP6 standardized to research-grade specifications.",
      },
      {
        q: "Why take IP6 between meals?",
        a: "Take IP6 on an empty stomach, away from mineral-rich meals, for the best absorption.",
      },
      {
        q: "Is this product third-party tested?",
        a: "Yes. Every batch is tested for purity, potency, and heavy-metal contamination by an independent ISO-accredited laboratory.",
      },
      {
        q: "Can I take IP6 with other supplements?",
        a: "IP6 is commonly taken alongside other wellness routines. We recommend consulting your healthcare professional to coordinate any supplement stack.",
      },
    ],
    relatedSkus: ["SKN-LSC-BASE", "FIL-CITRATE-BASE"],
    requiresDsheaDisclaimer: true,
    shipsGlobally: false,
  },
  {
    slug: "ip6-la-sante-cream",
    sku: "SKN-LSC-BASE",
    name: "IP6 La Santé Cream",
    shortDescription:
      "Cortisone-free topical formulated for skin affected by eczema, sensitivity, and daily environmental stress.",
    category: "skincare",
    heroClaim: "Cortisone-free",
    highlights: [
      "Cortisone-free formula",
      "Formulated for skin affected by eczema",
      "Fragrance-free, dye-free, and paraben-free",
      "Dermatologist-reviewed",
      "Non-comedogenic base",
    ],
    ingredients: [
      "Aqua (purified water)",
      "Inositol hexaphosphate complex",
      "Shea butter",
      "Ceramide NP",
      "Glycerin",
      "Tocopherol (vitamin E)",
      "Niacinamide",
      "Allantoin",
    ],
    howToUse: [
      "Apply a thin layer to clean, dry skin up to three times daily.",
      "Gently massage until absorbed.",
      "Safe for face, body, and sensitive areas. Discontinue if irritation occurs.",
    ],
    variants: [
      {
        id: "skn-eczema-50ml",
        sku: "SKN-LSC-ECZ-50",
        name: "Eczema Cream",
        format: "Jar",
        size: "50 ml",
        priceCents: { USD: 5900, CAD: 8100, GBP: 4700, AUD: 8900, EUR: 5500, INR: 493000 },
        weightGrams: 95,
        inStock: true,
      },
      {
        id: "skn-uv-50ml",
        sku: "SKN-LSC-UV-50",
        name: "UV Protection",
        format: "Tube",
        size: "50 ml SPF 30",
        priceCents: { USD: 4900, CAD: 6700, GBP: 3900, AUD: 7400, EUR: 4500, INR: 409900 },
        weightGrams: 85,
        inStock: true,
      },
      {
        id: "skn-sensitive-75ml",
        sku: "SKN-LSC-SEN-75",
        name: "Sensitive Skin Moisturizer",
        format: "Tube",
        size: "75 ml",
        priceCents: { USD: 4400, CAD: 6000, GBP: 3500, AUD: 6700, EUR: 4100, INR: 368000 },
        weightGrams: 110,
        inStock: true,
      },
    ],
    subscriptionCycles: [
      { days: 30, discountPct: 12 },
      { days: 60, discountPct: 18 },
    ],
    images: [
      { url: HERO_CREAM, alt: "IP6 La Santé Cream jar next to a linen backdrop.", width: 1600, height: 1200 },
      { url: DETAIL_CREAM_2, alt: "A swatch of La Santé cream on a soft neutral surface.", width: 1600, height: 1200 },
      { url: DETAIL_CREAM_3, alt: "La Santé Cream in morning light beside botanical ingredients.", width: 1600, height: 1200 },
    ],
    faq: [
      {
        q: "Is La Santé Cream safe for children?",
        a: "The formulation is gentle and fragrance-free, but we recommend consulting a pediatric dermatologist before use on children under 2.",
      },
      {
        q: "Can I use this on my face?",
        a: "Yes. The non-comedogenic base is formulated for use on face, neck, and body.",
      },
      {
        q: "How long before I see results?",
        a: "Results vary by individual. Many customers report noticeable improvement in skin comfort within 2–4 weeks of consistent use.",
      },
      {
        q: "Is it tested on animals?",
        a: "No. IP6 La Santé Cream is cruelty-free and never tested on animals.",
      },
    ],
    relatedSkus: ["SUP-IP6-BASE", "FIL-CITRATE-BASE"],
    requiresDsheaDisclaimer: true,
    shipsGlobally: false,
  },
  {
    slug: "ip6-citrate-water-filter",
    sku: "FIL-CITRATE-BASE",
    name: "IP6-Citrate Water Filter",
    shortDescription:
      "Gravity-fed water purification using IP6-Citrate media. Removes lead and arsenic in under 60 seconds. No electricity required.",
    category: "filter",
    heroClaim: "Removes lead and arsenic in under 60 seconds",
    highlights: [
      "Removes lead and arsenic in under 60 seconds of flow time",
      "Fully gravity-fed. No electricity required",
      "Replaceable IP6-Citrate cartridge",
      "BPA-free food-grade housing",
      "Designed for household and humanitarian field use",
    ],
    specifications: [
      { label: "Capacity", value: "3.8 L (1 gallon) reservoir" },
      { label: "Flow rate", value: "Up to 2 L per minute" },
      { label: "Cartridge life", value: "~1,500 L (varies by source water)" },
      { label: "Filtration targets", value: "Lead, arsenic, cadmium, mercury, chlorine" },
      { label: "Housing", value: "Food-grade BPA-free copolymer" },
      { label: "Dimensions", value: "28 × 28 × 48 cm" },
      { label: "Weight", value: "1.9 kg" },
      { label: "Power", value: "None required" },
    ],
    howToUse: [
      "Rinse the IP6-Citrate cartridge under cold water for 30 seconds before first use.",
      "Seat the cartridge into the upper reservoir and twist to lock.",
      "Fill the upper reservoir with source water. Filtered water collects in the lower chamber within 60 seconds of contact with the media.",
      "Replace the cartridge every 1,500 L or 90 days, whichever comes first.",
    ],
    variants: [
      {
        id: "fil-unit",
        sku: "FIL-CITRATE-UNIT",
        name: "Complete Filter Unit",
        format: "System",
        size: "3.8 L capacity",
        priceCents: { USD: 14900, CAD: 20400, GBP: 11800, AUD: 22500, EUR: 13700, INR: 1245000 },
        weightGrams: 2100,
        inStock: true,
      },
      {
        id: "fil-cart-single",
        sku: "FIL-CITRATE-CART-1",
        name: "Replacement Cartridge",
        format: "Cartridge",
        size: "Single pack",
        priceCents: { USD: 3900, CAD: 5300, GBP: 3100, AUD: 5900, EUR: 3600, INR: 326000 },
        weightGrams: 220,
        inStock: true,
      },
      {
        id: "fil-cart-triple",
        sku: "FIL-CITRATE-CART-3",
        name: "Replacement Cartridge",
        format: "Cartridge",
        size: "Triple pack",
        priceCents: { USD: 10900, CAD: 14900, GBP: 8700, AUD: 16500, EUR: 10000, INR: 911000 },
        weightGrams: 650,
        inStock: true,
      },
    ],
    subscriptionCycles: [
      { days: 60, discountPct: 10 },
      { days: 90, discountPct: 15 },
    ],
    images: [
      { url: HERO_FILTER, alt: "IP6-Citrate gravity-fed water filter on a kitchen counter.", width: 1600, height: 1200 },
      { url: DETAIL_FILTER_2, alt: "Close-up of the IP6-Citrate replacement cartridge.", width: 1600, height: 1200 },
      { url: DETAIL_FILTER_3, alt: "Filtered water pouring from the IP6-Citrate dispenser.", width: 1600, height: 1200 },
    ],
    faq: [
      {
        q: "How is the IP6-Citrate media different from carbon filters?",
        a: "Activated-carbon filters primarily reduce chlorine and taste. The IP6-Citrate media is engineered to chelate heavy-metal contaminants (lead, arsenic, cadmium) at flow rates that typical gravity filters cannot match.",
      },
      {
        q: "Does it need electricity or plumbing?",
        a: "No. The system is fully gravity-fed and requires no electricity, no plumbing, and no batteries.",
      },
      {
        q: "How often do I replace the cartridge?",
        a: "Every 1,500 liters of throughput or 90 days of active use, whichever comes first. Our cartridge subscription delivers replacements on your chosen cycle.",
      },
      {
        q: "Is the system NSF certified?",
        a: "NSF certification is in progress. The device is tested against NSF/ANSI 53 protocols by an ISO-accredited laboratory; the certification mark will be added to this page once issued.",
      },
    ],
    relatedSkus: ["SUP-IP6-BASE", "SKN-LSC-BASE"],
    requiresDsheaDisclaimer: false,
    shipsGlobally: true,
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
