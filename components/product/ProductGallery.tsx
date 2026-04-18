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

  return (
    <div className="grid gap-4 lg:grid-cols-[72px_1fr] lg:gap-6">
      <ol
        aria-label="Product image thumbnails"
        className="order-2 lg:order-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-none"
      >
        {images.map((im, i) => (
          <li key={im.url + i}>
            <button
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative block size-16 lg:size-[72px] rounded-md overflow-hidden border-2 transition-colors",
                i === active ? "border-forest-700" : "border-transparent hover:border-ivory-300",
              )}
            >
              <Image src={im.url} alt={im.alt} fill sizes="72px" className="object-cover" />
            </button>
          </li>
        ))}
      </ol>
      <div className="order-1 lg:order-2">
        <button
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Close zoom" : "Zoom image"}
          className="group relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-ivory-200 cursor-zoom-in"
        >
          <Image
            src={img.url}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            priority={active === 0}
            className={cn(
              "object-cover transition-transform duration-500 ease-brand",
              zoomed ? "scale-150" : "group-hover:scale-105",
            )}
          />
        </button>
      </div>
    </div>
  );
}
