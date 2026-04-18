import type { Rule } from "@sanity/types";

export default {
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string", validation: (r: Rule) => r.required() },
    { name: "title", title: "Title / role", type: "string" },
    { name: "bio", title: "Bio", type: "text", rows: 3 },
    { name: "avatar", title: "Avatar", type: "image", options: { hotspot: true } },
  ],
};
