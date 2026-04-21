import type { MetadataRoute } from "next";
import { products } from "@/content/products";
import { blogPosts } from "@/content/blog-posts";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/shop",
    "/science",
    "/about",
    "/founder",
    "/testimonials",
    "/faq",
    "/blog",
    "/contact",
    "/international-shipping",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookie-policy",
    "/legal/refund-policy",
    "/legal/shipping-policy",
    "/legal/accessibility",
  ];

  const now = new Date();

  return [
    ...staticPaths.map((p) => ({
      url: `${base}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...blogPosts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
