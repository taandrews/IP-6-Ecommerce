export interface FaqItem {
  q: string;
  a: string;
  /** Optional link under the answer, for the one place a longer page covers the topic. */
  more?: { href: string; label: string };
}
export interface FaqCategory {
  id: string;
  label: string;
  intro?: string;
  items: FaqItem[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: "shipping",
    label: "Shipping and delivery",
    items: [
      {
        q: "Where does IP6 Original ship?",
        a: "IP6 Original ships to the United States and 27 other countries. The same list of countries is offered at checkout. US orders over $75 ship free. Other rates are shown at checkout from your address.",
        more: { href: "/international-shipping", label: "See every country we ship to" },
      },
      {
        q: "When will my order arrive?",
        a: "Pre-orders start shipping in November 2026, in the order they were received. You get a tracking email the day your order ships. From there, US standard delivery usually takes 3 to 6 business days (1 to 3 expedited) and international orders 7 to 14 business days, though busy periods and carrier delays can stretch that. If your package is past that window, contact us with your order number and we will check on it within one business day.",
      },
      {
        q: "What if the pre-order shipping date changes?",
        a: "We email every pre-order customer the new date as soon as we know it. If you would rather not wait, reply to that email or use the contact form before your order ships and we cancel it for a full refund to your original payment method.",
      },
      {
        q: "Do I pay duties or import taxes?",
        a: "Where possible, import duties and taxes are calculated at checkout. Otherwise, duties are the responsibility of the recipient and are collected by the carrier on delivery.",
        more: { href: "/legal/shipping-policy", label: "Read the shipping policy" },
      },
    ],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    items: [
      {
        q: "How do subscriptions work?",
        a: "Choose Subscribe & save on the product page and pick a delivery every 30 days (15% off) or every 90 days (20% off). Your first delivery is charged at checkout. Each later delivery is charged at the same subscription price plus standard shipping, to the same card, and we email a reminder before each renewal.",
      },
      {
        q: "Can I pause, skip, or cancel?",
        a: "Yes. Skip a delivery, pause, or cancel at any time from your account dashboard. Changes made before a renewal is charged apply to that renewal, and cancelling stops all future charges.",
        more: { href: "/account/subscriptions", label: "Manage your subscription" },
      },
    ],
  },
  {
    id: "returns",
    label: "Returns and refunds",
    items: [
      {
        q: "What is the return policy?",
        a: "All sales are final once shipped. Dietary supplements cannot be restocked or resold after they leave our care.",
        more: { href: "/legal/refund-policy", label: "Read the refund policy" },
      },
      {
        q: "My order arrived damaged or incorrect. What do I do?",
        a: "Contact us right away through the contact form with your order number and photos of the item and the packaging. We reply within one business day and review each case individually to make it right. No need to send the item back.",
        more: { href: "/contact", label: "Open the contact form" },
      },
    ],
  },
  {
    id: "taking-ip6",
    label: "Taking IP6 Original",
    items: [
      {
        q: "How do I take IP6 Original?",
        a: "The label directions: take 4 capsules once or twice daily with water, or as directed by your healthcare professional. The full directions, serving size, and cautions are on one page.",
        more: { href: "/how-to-take", label: "Read the full directions" },
      },
      {
        q: "Is IP6 Original safe to take daily?",
        a: "The suggested use is 4 capsules once or twice daily with water, or as directed by a healthcare professional. Always consult your physician before beginning any supplement regimen, including IP6 Original.",
      },
      {
        q: "Are there any side effects?",
        a: "Always consult your physician before beginning any supplement regimen. Stop taking IP6 Original and contact your physician if you experience any adverse reaction.",
      },
      {
        q: "Can I take IP6 Original with other medications or supplements?",
        a: "Consult your healthcare professional to coordinate IP6 Original with any medications or other supplements you take.",
      },
      {
        q: "Is IP6 Original safe during pregnancy or nursing?",
        a: "If you are pregnant, nursing, taking medication, or managing a health condition, consult your healthcare provider before use.",
      },
    ],
  },
  {
    id: "what-is-ip6",
    label: "What is IP6",
    intro: "An introduction to the molecule at the center of everything we make: what IP6 and Inositol are, and why they are paired.",
    items: [
      {
        q: "What is IP6?",
        a: "IP6 is inositol hexaphosphate, a molecule made of inositol carrying six phosphate groups. It occurs naturally in seeds, grains, legumes, and bran, where it stores phosphorus and minerals for the plant. Professor AbulKalam M. Shamsuddin, MD, PhD, pioneered research on IP6 at the University of Maryland School of Medicine before retiring from the university in 2020. IP6 Original contains Calcium-Magnesium IP6.",
      },
      {
        q: "What is Inositol, and how is it related to IP6?",
        a: "Inositol is the simple compound at the core of IP6: the same molecule, without the six phosphate groups attached. It is found naturally in the body and in many everyday foods. When IP6 is metabolized, it gives up phosphate groups and yields inositol and its lower phosphate forms, which is why the two are so closely linked.",
      },
      {
        q: "Why are IP6 and Inositol taken together?",
        a: "Professor Shamsuddin's research centers on IP6 and Inositol as a pair rather than IP6 alone, and IP6 Original reflects that approach by combining both in one formula.",
      },
    ],
  },
  {
    id: "why-this-brand",
    label: "Why this brand",
    items: [
      {
        q: "What makes IP6 Original different from other IP6 supplements?",
        a: "IP6 Original is of the highest purity, research grade, third-party tested, formulated by the scientist who pioneered that research.",
        more: { href: "/the-difference", label: "See what goes into it" },
      },
      {
        q: "Why does purity matter?",
        a: "If the molecule is not intact, it is not the molecule the research describes.",
      },
      {
        q: "How is IP6 Original manufactured and tested?",
        a: "IP6 Original is manufactured in a cGMP-certified facility and independently third-party tested for purity, potency, and quality.",
      },
      {
        q: "Is IP6 Original FDA approved?",
        a: "IP6 Original is a dietary supplement, not a drug. Under DSHEA, dietary supplements are regulated differently from pharmaceuticals.",
      },
    ],
  },
];

// Backwards compatibility for any code that still imports the flat list.
export const globalFaqs: FaqItem[] = faqCategories.flatMap((c) => c.items);
