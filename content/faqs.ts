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
    intro: "Reinforces Chapter 1 of the story. Final Q&A copy to be provided by Client.",
    items: [
      {
        q: "What is IP6?",
        a: "IP6 (inositol hexaphosphate) is a naturally occurring compound found in seeds, grains, and legumes. It is the molecule Professor AbulKalam M. Shamsuddin, MD, PhD has spent more than 40 years researching at the University of Maryland School of Medicine.",
      },
      {
        q: "Where does IP6 come from?",
        a: "Final source and extraction copy to be provided by Client.",
      },
      {
        q: "Who discovered IP6's potential?",
        a: "Professor Shamsuddin published his first paper on inositol hexaphosphate in 1985 and has since authored more than 200 peer-reviewed studies on the molecule.",
      },
    ],
  },
  {
    id: "why-this-brand",
    label: "Why this brand",
    intro: "Reinforces Chapter 2 of the story. Final Q&A copy to be provided by Client.",
    items: [
      {
        q: "What makes IP6 Original different from other IP6 supplements?",
        a: "Most IP6 on the market is manufactured at 50 to 80 percent purity with no connection to the original research. IP6 Original is standardized to 95 percent or greater purity and is the only IP6 supplement formulated by the scientist who holds the patents.",
      },
      {
        q: "Why does purity matter?",
        a: "If the molecule is not intact, it is not the molecule the research describes. Final detailed copy to be provided by Client.",
      },
      {
        q: "Is IP6 Original FDA approved?",
        a: "IP6 Original is a dietary supplement, not a drug. Under DSHEA, dietary supplements are regulated differently from pharmaceuticals. Final regulatory copy to be confirmed by Client.",
      },
    ],
  },
  {
    id: "how-is-it-made",
    label: "How is it made",
    intro: "Reinforces Chapter 3 of the story. Final Q&A copy to be provided by Client.",
    items: [
      {
        q: "How is IP6 Original manufactured?",
        a: "IP6 Original is manufactured in a cGMP-certified facility at 95 percent or greater purity. Every batch is HPLC-tested. Final manufacturing copy to be provided by Client.",
      },
      {
        q: "Is every batch tested?",
        a: "Yes. Every batch is verified by HPLC for IP6 purity and screened for heavy metals against USP <232> standards. A certificate of analysis is available on the product page.",
      },
      {
        q: "Where is IP6 Original made?",
        a: "Final manufacturing-location copy to be confirmed by Client.",
      },
    ],
  },
  {
    id: "subscriptions-and-shipping",
    label: "Subscriptions and shipping",
    items: [
      {
        q: "How do subscriptions work?",
        a: "Choose your delivery cycle at checkout. Subscriptions are managed entirely from your account dashboard — pause, skip, change frequency, or cancel anytime in one click.",
      },
      {
        q: "Where does IP6 Original ship?",
        a: "At launch, IP6 Original ships to the United States and Canada. Additional country availability and shipping rates to be confirmed by Client.",
      },
      {
        q: "What is the return policy?",
        a: "Final return-policy copy to be confirmed by Client. See our Refund Policy page for the current terms.",
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
        a: "Always consult your physician before beginning any supplement regimen, including IP6 Original. Final safety profile to be provided by Client.",
      },
      {
        q: "Are there any side effects?",
        a: "Final side-effect copy to be provided by Client. Stop taking IP6 Original and contact your physician if you experience any adverse reaction.",
      },
      {
        q: "Can I take IP6 Original with other medications or supplements?",
        a: "IP6 chelates multivalent cations, which means timing and pairing matter. Coordinate any new supplement with your healthcare professional. Final detailed interactions copy to be provided by Client.",
      },
      {
        q: "Is IP6 Original safe during pregnancy or nursing?",
        a: "Final pregnancy and nursing guidance to be provided by Client. Always consult your physician.",
      },
    ],
  },
];

// Backwards compatibility for any code that still imports the flat list.
export const globalFaqs: FaqItem[] = faqCategories.flatMap((c) => c.items);
