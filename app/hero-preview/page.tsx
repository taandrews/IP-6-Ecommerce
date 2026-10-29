import type { Metadata } from "next";
import { HeroCinemagraph } from "@/components/home/HeroCinemagraph";
import { HeroCinemagraphTyped } from "@/components/home/HeroCinemagraphTyped";

/* Review page for the two cinemagraph hero candidates. Not linked, not indexed.
   ?v=1 keeps the duotone-and-type effect; ?v=2 is the plain cinemagraph. */

export const metadata: Metadata = {
  title: "Hero preview",
  robots: { index: false, follow: false },
};

export default async function HeroPreviewPage(props: { searchParams: Promise<{ v?: string }> }) {
  const searchParams = await props.searchParams;
  const cta = "/shop#people";
  return searchParams.v === "2" ? <HeroCinemagraph ctaHref={cta} /> : <HeroCinemagraphTyped ctaHref={cta} />;
}
