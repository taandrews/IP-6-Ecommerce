import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { asset } from "@/lib/assets";

/**
 * Full-width founder band. Portrait takes at least half the width. When
 * /public/founder.mp4 exists the video plays muted behind the copy instead.
 */
export function FounderBand({ hasVideo }: { hasVideo: boolean }) {
  return (
    <section className="relative bg-cream text-navy-800" aria-labelledby="founder-h">
      {hasVideo ? (
        <div className="relative isolate overflow-hidden text-cream">
          <video
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={asset("founder/shamsuddin.png")}
            aria-hidden
          >
            <source src="/founder.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 -z-10 bg-navy-900/70" aria-hidden />
          <div className="container section-y max-w-4xl">
            <FounderCopy light />
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[420px] lg:min-h-[720px]">
            <Image
              src={asset("founder/shamsuddin.png")}
              alt="Portrait of Professor AbulKalam M. Shamsuddin, MD, PhD, founder and formulator of IP6 Original."
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-top"
            />
          </div>
          <div className="flex items-center">
            <div className="px-4 py-[72px] sm:px-10 lg:px-16 lg:py-[120px] xl:px-24">
              <FounderCopy />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FounderCopy({ light = false }: { light?: boolean }) {
  return (
    <>
      <p className={light ? "eyebrow-light mb-6" : "eyebrow mb-6"}>The Founder</p>
      <blockquote className={`font-serif italic text-[28px] leading-[1.2] tracking-[-0.01em] lg:text-[40px] ${light ? "text-cream" : "text-navy-800"}`}>
        &ldquo;IP6 Original is the supplement built to the specification his own research describes.&rdquo;
      </blockquote>
      <h2 id="founder-h" className={`mt-8 text-[22px] font-medium leading-snug lg:text-[26px] ${light ? "text-cream" : "text-navy-800"}`}>
        Prof. AbulKalam M. Shamsuddin, MD, PhD
      </h2>
      <p className={`mt-3 body-lg max-w-xl ${light ? "text-cream/80" : "text-navy-800/75"}`}>
        A physician-scientist who has spent his career at the University of Maryland School of Medicine researching the health properties of inositol hexaphosphate, and a pioneer of the published research on the molecule. He formulated IP6 Original to bring the product of that research directly to consumers.
      </p>
      <div className="mt-9">
        <Link href="/story#founder" className={light ? "btn-outline-cream" : "btn-outline-navy"}>
          Meet Prof. Shamsuddin
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </>
  );
}
