export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqCategory {
  id: string;
  label: string;
  items: FaqItem[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: "considering",
    label: "Considering IP6",
    items: [
      {
        q: "What makes IP-6 Research different?",
        a: "IP-6 Research, Inc. is the only consumer brand that standardizes inositol hexaphosphate to a 95%+ purity specification, verified by HPLC on every batch. Most commodity material ships at 50–80% intact.",
      },
      {
        q: "Who is IP6 Original for?",
        a: "Adults looking for a research-grade IP6 supplement to support immune health and healthy cell function as part of a daily routine. As with any supplement, consult your healthcare professional before starting.",
      },
      {
        q: "Is IP6 Original a drug?",
        a: "No. IP6 Original is a dietary supplement under DSHEA. It is not intended to diagnose, treat, cure, or prevent any disease.",
      },
    ],
  },
  {
    id: "taking",
    label: "Taking IP6",
    items: [
      {
        q: "What is the correct dose?",
        a: "Start with 1 capsule daily for the first week, then move to 2 capsules daily. Always discuss new supplements with your healthcare professional.",
      },
      {
        q: "When should I take it?",
        a: "On an empty stomach, with at least 8 oz of water, away from mineral-rich meals for the best absorption.",
      },
      {
        q: "Can I take it with other supplements?",
        a: "IP6 is commonly taken alongside other wellness routines. Please coordinate with your healthcare professional.",
      },
      {
        q: "What if I miss a dose?",
        a: "Take it as soon as you remember unless it is close to your next scheduled dose. Do not double up.",
      },
    ],
  },
  {
    id: "how-it-works",
    label: "How it works",
    items: [
      {
        q: "What is IP6?",
        a: "Inositol hexaphosphate (IP6) is a naturally occurring compound found in whole grains, legumes, seeds, and nuts. It is the primary storage form of phosphorus in plants.",
      },
      {
        q: "Why does purity matter?",
        a: "Research protocols typically require 90 to 95%+ pure material to produce consistent, reproducible outcomes. Partial forms (IP5, IP4, IP3) behave differently than the intact molecule and cannot be treated as a dilute version.",
      },
      {
        q: "Is every batch tested?",
        a: "Yes. Every batch is independently tested by an ISO 17025-accredited laboratory for purity, potency, heavy metals, and microbial contamination. Certificates of analysis are downloadable on each product page.",
      },
    ],
  },
  {
    id: "savings",
    label: "Savings & support",
    items: [
      {
        q: "How do subscriptions work?",
        a: "Choose your delivery cycle (30, 60, or 90 days). Save 15% to 20%. Skip, pause, change frequency, or cancel from your account in one click.",
      },
      {
        q: "Where do you ship?",
        a: "The IP6-Citrate Water Filter ships worldwide. The supplement and skincare ship to a curated list of countries listed on our International Shipping page.",
      },
      {
        q: "What is your return policy?",
        a: "Unopened products may be returned within 30 days for a full refund. Opened supplements and skincare may be exchanged for store credit. The water filter has a 60-day window.",
      },
      {
        q: "How do I contact support?",
        a: "Email support@ip6original.com. We respond within one business day.",
      },
    ],
  },
  {
    id: "company",
    label: "About the company",
    items: [
      {
        q: "Who founded IP-6 Research, Inc.?",
        a: "Dr. AbulKalam M. Shamsuddin, Professor of Pathology at the University of Maryland School of Medicine, with over 200 peer-reviewed publications on inositol hexaphosphate.",
      },
      {
        q: "Where are you located?",
        a: "15 Charles Plaza, Suite 2508, Baltimore, MD 21201, United States.",
      },
      {
        q: "Are your products tested on animals?",
        a: "No. Our skincare line is cruelty-free. The supplement is third-party tested on physical and chemical specifications only.",
      },
    ],
  },
];

// Backwards compatibility for any code that still imports the flat list.
export const globalFaqs: FaqItem[] = faqCategories.flatMap((c) => c.items);
