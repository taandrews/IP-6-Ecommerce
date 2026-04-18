import Image from "next/image";
import Link from "next/link";
import { Droplets, Globe2, Zap, Users } from "lucide-react";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";

const NSF_CERTIFIED = process.env.NEXT_PUBLIC_NSF_CERTIFIED === "true";

export function FilterSections({ product }: { product: Product }) {
  return (
    <>
      {/* Performance claims banner — device, not supplement, so this is allowed */}
      <section className="bg-forest-800 text-ivory-100 py-20">
        <div className="container max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow text-gold-300 mb-3">Performance</p>
            <h2 className="font-display text-display-md mb-4">
              Lead and arsenic removed in under 60 seconds.
            </h2>
            <p className="text-ivory-100/85 leading-relaxed mb-6">
              The IP6-Citrate cartridge is engineered to chelate heavy-metal contaminants at flow rates typical gravity filters cannot match. Performance verified against NSF/ANSI 53 protocols by an ISO-accredited laboratory.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              {NSF_CERTIFIED ? (
                <Badge variant="gold">NSF certified</Badge>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed border-gold-300 px-3 py-2 text-xs text-ivory-100/70">
                  <span
                    className="inline-block size-2 rounded-full bg-gold-300"
                    aria-hidden
                  />
                  NSF certification pending — badge will activate when issued.
                </div>
              )}
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=1600&auto=format&fit=crop"
              alt="Water is poured into the IP6-Citrate filter reservoir."
              fill
              sizes="(min-width:768px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Humanitarian use case */}
      <section className="container py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1600&auto=format&fit=crop"
              alt="Community members at a remote water access point at dawn."
              fill
              sizes="(min-width:1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-3">Humanitarian use</p>
            <h2 className="font-display text-display-md text-forest-800 mb-4">
              Built for the households we often can't reach with a power grid.
            </h2>
            <p className="text-ink/85 leading-relaxed mb-6">
              The IP6-Citrate Water Filter is used by humanitarian partners in South and Southeast Asia, West Africa, and disaster-response contexts — environments where electricity and replacement-part supply chains are uncertain. A portion of every consumer sale helps subsidize those deployments.
            </p>
            <ul className="grid grid-cols-2 gap-3 text-sm text-ink/80">
              <li className="flex items-center gap-2"><Droplets className="size-4 text-forest-600" />Gravity-fed</li>
              <li className="flex items-center gap-2"><Zap className="size-4 text-forest-600" />No electricity</li>
              <li className="flex items-center gap-2"><Users className="size-4 text-forest-600" />Family-scale flow</li>
              <li className="flex items-center gap-2"><Globe2 className="size-4 text-forest-600" />Ships worldwide</li>
            </ul>
            <Link
              href="/contact?topic=humanitarian"
              className="btn-secondary mt-6 inline-flex"
            >
              Partner with us
            </Link>
          </div>
        </div>
      </section>

      {/* Unused - placeholder to avoid TS unused param warning */}
      <span className="sr-only">{product.sku}</span>
    </>
  );
}
