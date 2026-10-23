import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { StickyDisclaimer } from "@/components/layout/StickyDisclaimer";
import { HowToTakeContent } from "@/components/sections/HowToTakeContent";
import { hreflangAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "How to take IP6 Original",
  description: "The label directions for IP6 Original, the serving size, and when to talk to a healthcare professional first.",
  alternates: hreflangAlternates("/how-to-take"),
};

/** The one place the full directions live. The FAQ and product page link here instead of repeating them. */
export default function HowToTakePage() {
  return (
    <>
      <HowToTakeContent />
      <StickyDisclaimer />
      <Footer showDshea />
    </>
  );
}
