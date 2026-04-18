import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-09-20";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
});

const builder = imageUrlBuilder(sanityClient);
export function urlFor(source: unknown) {
  return builder.image(source as never);
}

export const queries = {
  allBlogPosts: `*[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt, "cover": cover.asset->url,
    "author": author->{name, "avatar": avatar.asset->url}
  }`,
  blogPostBySlug: `*[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, excerpt, publishedAt, body,
    "cover": cover.asset->url,
    "author": author->{name, bio, "avatar": avatar.asset->url},
    seo { title, description }
  }`,
  testimonials: `*[_type == "testimonial" && approved == true] | order(publishedAt desc) {
    _id, authorName, body, product, rating, publishedAt
  }`,
};
