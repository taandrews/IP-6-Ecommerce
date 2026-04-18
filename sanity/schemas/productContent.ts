import type { Rule } from "@sanity/types";

export default {
  name: "productContent",
  title: "Product content",
  type: "document",
  fields: [
    {
      name: "sku",
      title: "SKU",
      type: "string",
      options: {
        list: [
          { title: "IP6 Original Supplement", value: "SUP-IP6-BASE" },
          { title: "IP6 La Santé Cream", value: "SKN-LSC-BASE" },
          { title: "IP6-Citrate Water Filter", value: "FIL-CITRATE-BASE" },
        ],
      },
      validation: (r: Rule) => r.required(),
    },
    { name: "additionalCopy", title: "Additional marketing copy", type: "array", of: [{ type: "block" }] },
    {
      name: "lifestyleImages",
      title: "Lifestyle images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string", title: "Alt text" }] }],
    },
  ],
};
