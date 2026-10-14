"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const img = images[active];
  if (!img) return null;

  // Container aspect ratio follows the active image so portrait bottles
  // and landscape lifestyle shots both fit correctly. Portrait images
  // get displayed with object-contain on a soft-white ground; landscape
  // images can fill with object-cover.
  const ratio = img.width / img.height;
  const isPortrait = ratio < 1;
  const containerAspect = isPortrait ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <div className="grid gap-4 lg:grid-cols-[80px_1fr] lg:gap-6">
      <ol
        aria-label="Product image thumbnails"
        className="order-2 lg:order-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-none"
      >
        {images.map((im, i) => {
          const thumbPortrait = im.width / im.height < 1;
          return (
            <li key={im.url + i}>
              <button
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block size-20 rounded-md overflow-hidden border-2 transition-colors bg-cloud-200",
                  i === active ? "border-navy-800" : "border-transparent hover:border-cloud-400",
                )}
              >
                <Image
                  src={im.url}
                  alt={im.alt}
                  fill
                  sizes="80px"
                  className={thumbPortrait ? "object-contain p-1.5" : "object-cover"}
                />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="order-1 lg:order-2">
        <button
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Close zoom" : "Zoom image"}
          className={cn(
            "group relative w-full rounded-lg overflow-hidden cursor-zoom-in",
            containerAspect,
            isPortrait ? "bg-cloud-200" : "bg-cloud-200",
          )}
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            priority={active === 0}
            className={cn(
              "transition-transform duration-500 ease-brand",
              isPortrait ? "object-contain p-6" : "object-cover",
              zoomed ? "scale-150" : "group-hover:scale-105",
            )}
          />
        </button>
      </div>
    </div>
  );
}
