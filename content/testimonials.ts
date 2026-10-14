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

// No customer reviews have been collected yet. Reviews submitted through the
// product page are stored by the reviews API, not here.
export const testimonials: Testimonial[] = [];
