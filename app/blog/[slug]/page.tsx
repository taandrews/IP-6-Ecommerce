import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { blogPosts, getBlogPostBySlug } from "@/content/blog-posts";
import { formatDate } from "@/lib/utils";
import { hreflangAlternates } from "@/lib/i18n";

interface Params {
  params: { slug: string };
}

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: hreflangAlternates(`/blog/${post.slug}`),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default function BlogPostPage({ params }: Params) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "IP-6 Research, Inc.",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com"}/logo.svg`,
      },
    },
  };

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article className="container py-16 lg:py-24 max-w-3xl">
        <div className="mb-8">
          <Badge variant="gold" className="mb-4">{post.category}</Badge>
          <h1 className="font-display text-display-xl text-forest-800 mb-4 text-balance">
            {post.title}
          </h1>
          <p className="text-sm text-ink/65">
            {post.author} · {formatDate(post.publishedAt)} · {post.readMinutes} min read
          </p>
        </div>
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-10">
          <Image
            src={post.coverImage}
            alt={post.coverAlt}
            fill
            priority
            sizes="(min-width:1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-6 text-ink/85 leading-relaxed text-lg">
          {post.content.map((block, i) => (
            <div key={i}>
              {block.heading ? (
                <h2 className="font-display text-display-md text-forest-800 mt-8 mb-3">
                  {block.heading}
                </h2>
              ) : null}
              <p>{block.paragraph}</p>
            </div>
          ))}
        </div>
      </article>

      <section className="bg-ivory-200 py-20">
        <div className="container max-w-5xl">
          <h2 className="font-display text-display-md text-forest-800 mb-8">Continue reading</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4">
                  <Image
                    src={r.coverImage}
                    alt={r.coverAlt}
                    fill
                    sizes="(min-width:1024px) 320px, 50vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-brand"
                  />
                </div>
                <h3 className="font-display text-lg text-forest-800 group-hover:text-forest-700">
                  {r.title}
                </h3>
                <p className="text-sm text-ink/60 mt-1">{formatDate(r.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Footer />
    </>
  );
}
