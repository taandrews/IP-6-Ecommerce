import { Facebook, Instagram, Youtube } from "lucide-react";
import { SOCIALS, type SocialId } from "@/lib/socials";

const ICONS: Record<SocialId, typeof Facebook> = { facebook: Facebook, instagram: Instagram, youtube: Youtube };

const LINK =
  "inline-flex min-h-11 items-center gap-2 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-600";

/**
 * The three social accounts as their logos. Icons only in a row (footer), or
 * stacked with the account name beside each logo (contact page).
 */
export function SocialLinks({ showHandles = false, className = "" }: { showHandles?: boolean; className?: string }) {
  return (
    <ul className={`${showHandles ? "flex flex-col gap-1" : "flex items-center gap-5"} ${className}`}>
      {SOCIALS.map((s) => {
        const Icon = ICONS[s.id];
        return (
          <li key={s.id}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`IP6 Original on ${s.label} (opens in a new tab)`}
              className={`${LINK} ${showHandles ? "text-forest-700" : "text-navy-800"}`}
            >
              <Icon size={showHandles ? 20 : 22} aria-hidden="true" />
              {showHandles ? (
                <span>
                  {s.label}: <span className="underline underline-offset-4">{s.handle}</span>
                </span>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
