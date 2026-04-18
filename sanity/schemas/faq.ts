import type { Rule } from "@sanity/types";

export default {
  name: "faq",
  title: "FAQ item",
  type: "document",
  fields: [
    { name: "question", title: "Question", type: "string", validation: (r: Rule) => r.required() },
    { name: "answer", title: "Answer", type: "text", rows: 4, validation: (r: Rule) => r.required() },
    {
      name: "scope",
      title: "Scope",
      type: "string",
      options: {
        list: [
          { title: "Global", value: "global" },
          { title: "Supplement", value: "SUP-IP6-BASE" },
          { title: "Skincare", value: "SKN-LSC-BASE" },
          { title: "Water filter", value: "FIL-CITRATE-BASE" },
        ],
      },
      initialValue: "global",
    },
    { name: "order", title: "Display order", type: "number" },
  ],
};
