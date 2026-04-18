import type { Rule } from "@sanity/types";

export default {
  name: "blogPost",
  title: "Blog post",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (r: Rule) => r.required().max(120) },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r: Rule) => r.required() },
    { name: "excerpt", title: "Excerpt", type: "text", rows: 3, validation: (r: Rule) => r.required().max(240) },
    { name: "category", title: "Category", type: "string", options: { list: ["Science", "Wellness", "Company", "Humanitarian"] } },
    {
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (r: Rule) => r.required(),
    },
    { name: "publishedAt", title: "Published at", type: "datetime", validation: (r: Rule) => r.required() },
    { name: "cover", title: "Cover image", type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string", title: "Alt text" }] },
    { name: "readMinutes", title: "Read time (min)", type: "number" },
    {
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string", title: "Alt text" }] },
      ],
    },
    {
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        { name: "title", type: "string", title: "SEO title" },
        { name: "description", type: "text", rows: 2, title: "SEO description" },
      ],
    },
  ],
  preview: {
    select: { title: "title", media: "cover" },
  },
};
