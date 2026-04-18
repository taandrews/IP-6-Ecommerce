export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  coverImage: string;
  coverAlt: string;
  category: "Science" | "Wellness" | "Company" | "Humanitarian";
  content: { heading?: string; paragraph: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "the-science-behind-ip6",
    title: "The science behind IP6",
    excerpt:
      "Inositol hexaphosphate is one of the most studied molecules in nutritional science. Here's a clear, non-clinical primer on what it is and why purity matters.",
    author: "IP-6 Research Editorial",
    publishedAt: "2026-03-01",
    readMinutes: 6,
    coverImage:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1600&auto=format&fit=crop",
    coverAlt: "Laboratory glassware arranged on a pale surface.",
    category: "Science",
    content: [
      {
        paragraph:
          "Inositol hexaphosphate — abbreviated IP6 — is a naturally occurring compound found in whole grains, legumes, seeds, and nuts. Chemically, it is a single inositol ring bound to six phosphate groups, and it serves as the primary storage form of phosphorus in plants.",
      },
      {
        heading: "Why purity is the conversation",
        paragraph:
          "Commodity IP6 on the market varies widely in purity. Institutional research protocols typically require 90–95%+ pure material to ensure consistent, reproducible outcomes. That's the specification we hold every batch of IP6 Original to.",
      },
      {
        heading: "Structure-function and why we talk about it that way",
        paragraph:
          "Under DSHEA, supplements in the United States are communicated via structure-function claims — language that describes how a nutrient supports healthy biological function, rather than treatment of disease. That's why you'll see us say 'supports immune health' and 'supports healthy cell function,' and never anything stronger.",
      },
      {
        heading: "A research heritage",
        paragraph:
          "IP6 has been the subject of academic investigation for decades. We believe the right way to communicate that heritage is with restraint: publish what the science supports, respect the regulatory frame, and let the quality of the product speak for itself.",
      },
    ],
  },
  {
    slug: "formulating-cortisone-free-skincare",
    title: "Formulating cortisone-free skincare for sensitive skin",
    excerpt:
      "Why we built IP6 La Santé Cream without corticosteroids, and the ingredient choices that shape the final product.",
    author: "Dr. Amelia Reeves",
    publishedAt: "2026-02-12",
    readMinutes: 5,
    coverImage:
      "https://images.unsplash.com/photo-1556228841-a3f527ebefe5?q=80&w=1600&auto=format&fit=crop",
    coverAlt: "Botanical skincare ingredients in glass jars.",
    category: "Wellness",
    content: [
      {
        paragraph:
          "Corticosteroids are remarkably effective at calming acute inflammation — and remarkably poorly suited for long-term daily use on sensitive skin. Skin thinning, rebound irritation, and tachyphylaxis are all well-documented concerns with prolonged topical steroid use.",
      },
      {
        heading: "What we reached for instead",
        paragraph:
          "IP6 La Santé Cream leads with a ceramide-rich base, shea butter for occlusive support, and a proprietary IP6 complex that forms the center of the formula. Niacinamide and allantoin support skin barrier function.",
      },
      {
        heading: "What we left out",
        paragraph:
          "No cortisone. No fragrance. No dye. No parabens. These aren't marketing choices — they're the result of formulating deliberately for skin that reacts to almost everything else.",
      },
    ],
  },
  {
    slug: "humanitarian-water-filtration",
    title: "Humanitarian water filtration: the design brief",
    excerpt:
      "Designing a filter that works without electricity, plumbing, or reliable supply chains — and the communities it was built for.",
    author: "IP-6 Research Editorial",
    publishedAt: "2026-01-18",
    readMinutes: 7,
    coverImage:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop",
    coverAlt: "A hillside village at dawn with visible water collection points.",
    category: "Humanitarian",
    content: [
      {
        paragraph:
          "Roughly two billion people lack access to safely managed drinking water. In many of those regions, the limiting factor isn't filtration technology — it's whether a given system can function without electricity, without municipal plumbing, and without a reliable cold-chain for replacement parts.",
      },
      {
        heading: "What we constrained ourselves to",
        paragraph:
          "The IP6-Citrate Water Filter was engineered under three non-negotiables: gravity-fed operation, shelf-stable cartridges, and a flow rate fast enough to be usable by a family. The device removes lead and arsenic in under 60 seconds of contact time.",
      },
      {
        heading: "Where it's deployed",
        paragraph:
          "Beyond consumer households, we supply the filter to humanitarian partners working in South and Southeast Asia, West Africa, and disaster-response contexts. A portion of every consumer sale helps subsidize those deployments.",
      },
    ],
  },
  {
    slug: "building-a-science-first-brand",
    title: "Building a science-first wellness brand",
    excerpt:
      "Notes from our first year on restraint, regulatory humility, and the discipline of saying less.",
    author: "The Founder",
    publishedAt: "2026-04-02",
    readMinutes: 4,
    coverImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop",
    coverAlt: "A quiet workspace with open notebooks and scientific journals.",
    category: "Company",
    content: [
      {
        paragraph:
          "The wellness industry rewards bold claims. We chose early on to take the opposite bet: that consumers who care about what they put in and on their bodies would reward a brand that tells them less — and backs up what it does say.",
      },
      {
        heading: "What restraint buys you",
        paragraph:
          "Regulatory safety. Credibility with scientifically-literate customers. And, unexpectedly, sharper product decisions: when you can't lean on hype, you have to make the product actually better.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
