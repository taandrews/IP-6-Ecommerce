import type { Rule } from "@sanity/types";

export default {
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    { name: "authorName", title: "Author name", type: "string", validation: (r: Rule) => r.required() },
    { name: "location", title: "Location", type: "string" },
    { name: "rating", title: "Rating", type: "number", validation: (r: Rule) => r.required().min(1).max(5) },
    { name: "body", title: "Body", type: "text", rows: 4, validation: (r: Rule) => r.required().max(1000) },
    {
      name: "product",
      title: "Product",
      type: "string",
      options: {
        list: [
          { title: "IP6 Original Supplement", value: "SUP-IP6-BASE" },
          { title: "IP6 La Santé Cream", value: "SKN-LSC-BASE" },
          { title: "IP6-Citrate Water Filter", value: "FIL-CITRATE-BASE" },
        ],
      },
    },
    { name: "approved", title: "Approved for display", type: "boolean", initialValue: false },
    { name: "publishedAt", title: "Published at", type: "datetime" },
  ],
};
