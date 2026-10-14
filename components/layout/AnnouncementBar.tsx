"use client";

/**
 * 56px top announcement bar. The CTA opens the pre-book drawer by
 * dispatching a window event the drawer listens for.
 */
export const OPEN_PREBOOK_EVENT = "ip6:open-prebook";

export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-14 bg-gold-500 text-navy-900">
      <div className="container flex h-14 items-center justify-between gap-4">
        <p className="min-w-0 truncate font-mono text-[12px] uppercase tracking-[0.12em]">
          <span className="font-semibold">Coming October 3, 2026</span>
          <span className="hidden sm:inline"> · Pre-book now and receive 20% off</span>
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PREBOOK_EVENT))}
          className="shrink-0 rounded-full bg-navy-800 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream hover:bg-navy-900"
        >
          Pre-book · 20% off
        </button>
      </div>
    </div>
  );
}
