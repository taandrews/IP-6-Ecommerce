export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqCategory {
  id: string;
  label: string;
  intro?: string;
  items: FaqItem[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: "what-is-ip6",
    label: "What is IP6",
    intro: "An introduction to the molecule at the center of everything we make: what IP6 and Inositol are, and why they are paired.",
    items: [
      {
        q: "What is IP6?",
        a: "IP6 is inositol hexaphosphate, a molecule made of inositol carrying six phosphate groups. It occurs naturally in seeds, grains, legumes, and bran, where it stores phosphorus and minerals for the plant. It is the molecule Professor AbulKalam M. Shamsuddin, MD, PhD, has spent his career researching at the University of Maryland School of Medicine.",
      },
      {
        q: "What is Inositol, and how is it related to IP6?",
        a: "Inositol is the simple compound at the core of IP6: the same molecule, without the six phosphate groups attached. It is found naturally in the body and in many everyday foods. When IP6 is metabolized, it gives up phosphate groups and yields inositol and its lower phosphate forms, which is why the two are so closely linked.",
      },
      {
        q: "Why are IP6 and Inositol taken together?",
        a: "Professor Shamsuddin's research centers on IP6 and Inositol as a pair rather than IP6 alone, and IP6 Original reflects that approach by combining both in one formula.",
      },
      {
        q: "Where does IP6 come from?",
        a: "IP6 occurs naturally in the bran of seeds, grains, and legumes. The IP6 in IP6 Original is produced as a high-purity formula and third-party tested.",
      },
      {
        q: "Who discovered IP6's potential?",
        a: "Professor Shamsuddin pioneered the published research on inositol hexaphosphate and has authored a substantial body of peer-reviewed work on the molecule.",
      },
    ],
  },
  {
    id: "why-this-brand",
    label: "Why this brand",
    items: [
      {
        q: "What makes IP6 Original different from other IP6 supplements?",
        a: "Most IP6 sold today is a commodity ingredient with no connection to the original research. IP6 Original is a high-purity formula, third-party tested, formulated by the scientist who pioneered that research.",
      },
      {
        q: "Why does purity matter?",
        a: "If the molecule is not intact, it is not the molecule the research describes.",
      },
      {
        q: "Is IP6 Original FDA approved?",
        a: "IP6 Original is a dietary supplement, not a drug. Under DSHEA, dietary supplements are regulated differently from pharmaceuticals.",
      },
    ],
  },
  {
    id: "how-is-it-made",
    label: "How is it made",
    items: [
      {
        q: "How is IP6 Original manufactured?",
        a: "IP6 Original is manufactured in a cGMP-certified facility and third-party tested.",
      },
      {
        q: "Is every batch tested?",
        a: "Yes. IP6 Original is independently third-party tested for purity, potency, and quality. A certificate of analysis is available on the product page.",
      },
    ],
  },
  {
    id: "subscriptions-and-shipping",
    label: "Subscriptions and shipping",
    items: [
      {
        q: "How do subscriptions work?",
        a: "Choose your delivery cycle at checkout. Subscriptions are managed entirely from your account dashboard. Pause, skip, change frequency, or cancel anytime in one click.",
      },
      {
        q: "Where does IP6 Original ship?",
        a: "At launch, IP6 Original ships to the United States and Canada.",
      },
      {
        q: "What is the return policy?",
        a: "Unopened products may be returned within 30 days of delivery for a full refund. See our Refund Policy page for the full terms.",
      },
      {
        q: "When will my order arrive?",
        a: "Standard US delivery is 3–6 business days. Canadian delivery 7–14 business days. Tracking is emailed when your order ships.",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety",
    items: [
      {
        q: "Is IP6 Original safe to take daily?",
        a: "The suggested use is 2 capsules once or twice daily with water, or as directed by a healthcare professional. Always consult your physician before beginning any supplement regimen, including IP6 Original.",
      },
      {
        q: "Are there any side effects?",
        a: "Always consult your physician before beginning any supplement regimen. Stop taking IP6 Original and contact your physician if you experience any adverse reaction.",
      },
      {
        q: "Can I take IP6 Original with other medications or supplements?",
        a: "IP6 binds minerals, which means timing and pairing matter. We recommend spacing IP6 away from mineral supplements, and coordinating any new supplement or medication with your healthcare professional.",
      },
      {
        q: "Is IP6 Original safe during pregnancy or nursing?",
        a: "If you are pregnant, nursing, taking medication, or managing a health condition, consult your healthcare provider before use.",
      },
    ],
  },
];

// Backwards compatibility for any code that still imports the flat list.
export const globalFaqs: FaqItem[] = faqCategories.flatMap((c) => c.items);
