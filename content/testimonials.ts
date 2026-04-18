export interface Testimonial {
  id: string;
  authorName: string;
  location?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  productSku?: string;
  verified?: boolean;
  submittedAt: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "t-001",
    authorName: "Eleanor M.",
    location: "Portland, OR",
    rating: 5,
    body: "I've tried a lot of wellness supplements, and IP6 Original is the one I actually stick with. The sourcing transparency is why I came back.",
    productSku: "SUP-IP6-BASE",
    verified: true,
    submittedAt: "2026-02-14T00:00:00Z",
  },
  {
    id: "t-002",
    authorName: "Rahim S.",
    location: "Toronto, ON",
    rating: 5,
    body: "La Santé Cream is the only moisturizer that my dermatologist-sensitive skin tolerates year-round. Fragrance-free and genuinely calming.",
    productSku: "SKN-LSC-BASE",
    verified: true,
    submittedAt: "2026-03-02T00:00:00Z",
  },
  {
    id: "t-003",
    authorName: "Clara W.",
    location: "Galway, IE",
    rating: 5,
    body: "We installed the IP6-Citrate filter at our remote cottage. No plumbing, no fuss. Lab-tested the output water ourselves and the metal counts dropped below detection.",
    productSku: "FIL-CITRATE-BASE",
    verified: true,
    submittedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "t-004",
    authorName: "Marcus T.",
    location: "Austin, TX",
    rating: 4,
    body: "Powder form is convenient for mixing into my morning routine. Wish the scoop was a little larger, but the product itself is solid.",
    productSku: "SUP-IP6-BASE",
    verified: true,
    submittedAt: "2026-03-11T00:00:00Z",
  },
  {
    id: "t-005",
    authorName: "Priya N.",
    location: "Mumbai, IN",
    rating: 5,
    body: "Finally a filtration system we can recommend to families in our community clinic that doesn't depend on electricity.",
    productSku: "FIL-CITRATE-BASE",
    verified: true,
    submittedAt: "2026-02-28T00:00:00Z",
  },
  {
    id: "t-006",
    authorName: "Hannah L.",
    location: "Berlin, DE",
    rating: 5,
    body: "I sent before-and-after photos to their team. The eczema cream has become a nighttime staple.",
    productSku: "SKN-LSC-BASE",
    verified: true,
    submittedAt: "2026-03-15T00:00:00Z",
  },
];
