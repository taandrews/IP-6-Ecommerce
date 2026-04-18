import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Hero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  image,
  imageAlt,
  children,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section className="container py-12 lg:py-24">
      <div
        className={cn(
          "grid gap-10 items-center",
          image ? "lg:grid-cols-2" : "",
          align === "center" && "text-center",
        )}
      >
        <div className={cn("max-w-xl", align === "center" && "mx-auto")}>
          {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
          <h1 className="text-display-xl text-forest-800 font-display text-balance mb-6">
            {title}
          </h1>
          {description ? (
            <p className="text-lg text-ink/75 leading-relaxed mb-8 max-w-prose">{description}</p>
          ) : null}
          <div className={cn("flex flex-wrap gap-3", align === "center" && "justify-center")}>
            {primaryCta ? (
              <Link href={primaryCta.href} className="btn-primary">{primaryCta.label}</Link>
            ) : null}
            {secondaryCta ? (
              <Link href={secondaryCta.href} className="btn-secondary">{secondaryCta.label}</Link>
            ) : null}
          </div>
          {children}
        </div>
        {image ? (
          <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-xl overflow-hidden shadow-card">
            <Image
              src={image}
              alt={imageAlt ?? ""}
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
