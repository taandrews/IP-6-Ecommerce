"use client";

import { useRef, useState } from "react";
import { Honeypot } from "@/components/ui/Honeypot";
import { Captcha, captchaPayload } from "@/components/ui/Captcha";
import type { Review } from "@/types";
import { Stars } from "@/components/ui/Stars";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function Reviews({ sku, initial = [], compact = false }: { sku: string; initial?: Review[]; compact?: boolean }) {
  const headingId = `reviews-${sku}`;
  const [reviews] = useState<Review[]>(initial);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit(form: FormData) {
    setSubmitting(true);
    const captcha = formRef.current ? await captchaPayload(formRef.current) : null;
    const payload = {
      captcha,
      sku,
      rating: Number(form.get("rating")),
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      authorName: String(form.get("authorName") ?? ""),
      website: String(form.get("website") ?? ""),
    };
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        // Reviews appear after moderation, so nothing is added to the list yet.
        setNotice({ ok: true, text: "Thank you. Your review will appear once our team has checked it." });
        setOpen(false);
      } else {
        setNotice({ ok: false, text: data.error ?? "We couldn't submit your review. Please try again." });
      }
    } catch {
      setNotice({ ok: false, text: "We couldn't submit your review. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby={headingId} className={compact ? "py-6" : "py-16 border-t border-ivory-300"}>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 id={headingId} className={compact ? "text-xl font-semibold text-navy-800 mb-2" : "font-display text-display-md text-forest-800 mb-2"}>
            Customer reviews
          </h2>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-3">
              <Stars rating={avg} size={18} />
              <span className="text-sm text-ink/70">
                {avg.toFixed(1)} out of 5 · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink/60">No reviews yet. Be the first.</p>
          )}
        </div>
        <button onClick={() => setOpen(true)} className="btn-secondary">
          Write a review
        </button>
      </div>
      {notice ? (
        <p role="status" className={notice.ok ? "mb-6 text-sm text-forest-700" : "mb-6 text-sm text-danger"}>
          {notice.text}
        </p>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="space-y-6">
          {reviews.map((r) => (
            <li key={r.reviewId} className="border-b border-ivory-300 pb-6 last:border-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Stars rating={r.rating} />
                  <span className="font-medium">{r.authorName}</span>
                  {r.verifiedPurchase ? <Badge variant="forest">Verified buyer</Badge> : null}
                </div>
                <time className="text-xs text-ink/60">{formatDate(r.createdAt)}</time>
              </div>
              <h3 className="mt-3 font-display text-lg text-forest-800">{r.title}</h3>
              <p className="mt-1 text-ink/80 leading-relaxed">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          className="fixed inset-0 z-50 bg-ink/40 grid place-items-center px-4"
          onClick={() => setOpen(false)}
        >
          <form
            ref={formRef}
            onClick={(e) => e.stopPropagation()}
            action={submit}
            className="relative bg-surface max-w-lg w-full rounded-lg shadow-card p-6 space-y-4"
          >
            <Honeypot />
            <h3 className="font-display text-xl text-forest-800">Share your experience</h3>
            <div>
              <label className="label">Rating</label>
              <select name="rating" defaultValue={5} required className="input">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${headingId}-name`} className="label">Your name</label>
              <input id={`${headingId}-name`} name="authorName" required className="input" maxLength={60} autoComplete="given-name" />
              <p className="mt-1 text-xs text-ink/60">Shown publicly with your review. A first name or initials is enough.</p>
            </div>
            <div>
              <label htmlFor={`${headingId}-title`} className="label">Title</label>
              <input id={`${headingId}-title`} name="title" required className="input" maxLength={80} />
            </div>
            <div>
              <label htmlFor={`${headingId}-body`} className="label">Review</label>
              <textarea id={`${headingId}-body`} name="body" required className="input min-h-[120px]" maxLength={1000} />
            </div>
            <p className="text-xs text-ink/60">
              Please describe your personal experience. Every review is checked by our team before it is published, and reviews that make health or disease claims are not published. By submitting you agree we may show your review and the name above on this site.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
