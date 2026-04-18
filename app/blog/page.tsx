import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { blogPosts } from "@/content/blog-posts";
import { formatDate } from "@/lib/utils";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Essays from IP-6 Research on science, formulation, humanitarian work, and building a restraint-first wellness company.",
  alternates: hreflangAlternates("/blog"),
};

export default function BlogIndexPage() {
  const [feature, ...rest] = blogPosts;
  return (
    <>
      <section className="container py-16 lg:py-24 max-w-2xl">
        <p className="eyebrow mb-4">The journal</p>
        <h1 className="font-display text-display-xl text-forest-800 mb-6 text-balance">
          On science, restraint, and the long work of doing wellness right.
        </h1>
      </section>

      {feature ? (
        <Link
          href={`/blog/${feature.slug}`}
          className="container block group pb-16"
        >
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src={feature.coverImage}
                alt={feature.coverAlt}
                fill
                priority
                sizes="(min-width:1024px) 720px, 100vw"
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-brand"
              />
            </div>
            <div>
              <Badge variant="gold" className="mb-3">{feature.category}</Badge>
              <h2 className="font-display text-display-lg text-forest-800 mb-3 group-hover:text-forest-700">
                {feature.title}
              </h2>
              <p className="text-ink/75 leading-relaxed mb-4">{feature.excerpt}</p>
              <p className="text-sm text-ink/60">
                {feature.author} · {formatDate(feature.publishedAt)} · {feature.readMinutes} min read
              </p>
            </div>
          </div>
        </Link>
      ) : null}

      <section className="container pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-5">
                <Image
                  src={post.coverImage}
                  alt={post.coverAlt}
                  fill
                  sizes="(min-width:1024px) 360px, 50vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-brand"
                />
              </div>
              <Badge variant="forest" className="mb-2">{post.category}</Badge>
              <h3 className="font-display text-xl text-forest-800 mb-2 group-hover:text-forest-700">
                {post.title}
              </h3>
              <p className="text-sm text-ink/70 line-clamp-2 mb-3">{post.excerpt}</p>
              <p className="text-xs text-ink/60">
                {formatDate(post.publishedAt)} · {post.readMinutes} min read
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
