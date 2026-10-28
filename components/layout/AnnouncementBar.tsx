import Link from "next/link";
import type { BannerSettings } from "@/types/records";
import { normalizeProductHref } from "@/lib/product-links";

/**
 * Site-wide announcement set in Admin, Site banner. Text is rendered as
 * plain text (never HTML). Links are limited to this site's paths or https
 * URLs by the admin API.
 */
export function AnnouncementBar({ banner }: { banner: BannerSettings }) {
  const href = banner.linkHref ? normalizeProductHref(banner.linkHref.trim()) : undefined;
  const internal = href?.startsWith("/");
  return (
    <div className="bg-navy-800 text-surface text-center text-xs sm:text-sm px-4 py-2" role="region" aria-label="Announcement">
      <span>{banner.text}</span>
      {href && banner.linkLabel ? (
        <>
          {" "}
          {internal ? (
            <Link href={href} className="underline underline-offset-2 font-semibold whitespace-nowrap">
              {banner.linkLabel}
            </Link>
          ) : (
            <a href={href} className="underline underline-offset-2 font-semibold whitespace-nowrap" rel="noopener noreferrer">
              {banner.linkLabel}
            </a>
          )}
        </>
      ) : null}
    </div>
  );
}
