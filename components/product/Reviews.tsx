"use client";

import { useState } from "react";
import type { Review } from "@/types";
import { Stars } from "@/components/ui/Stars";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function Reviews({ sku, initial = [] }: { sku: string; initial?: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initial);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit(form: FormData) {
    setSubmitting(true);
    const payload = {
      sku,
      rating: Number(form.get("rating")),
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      authorName: String(form.get("authorName") ?? ""),
    };
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { review } = await res.json();
        setReviews((rs) => [review, ...rs]);
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="reviews-heading" className="py-16 border-t border-ivory-300">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 id="reviews-heading" className="font-display text-display-md text-forest-800 mb-2">
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
            <p className="text-sm text-ink/60">No reviews yet — be the first.</p>
          )}
        </div>
        <button onClick={() => setOpen(true)} className="btn-secondary">
          Write a review
        </button>
      </div>

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
            onClick={(e) => e.stopPropagation()}
            action={submit}
            className="bg-surface max-w-lg w-full rounded-lg shadow-card p-6 space-y-4"
          >
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
              <label htmlFor="review-name" className="label">Your name</label>
              <input id="review-name" name="authorName" required className="input" />
            </div>
            <div>
              <label htmlFor="review-title" className="label">Title</label>
              <input id="review-title" name="title" required className="input" maxLength={80} />
            </div>
            <div>
              <label htmlFor="review-body" className="label">Review</label>
              <textarea id="review-body" name="body" required className="input min-h-[120px]" maxLength={1000} />
            </div>
            <p className="text-xs text-ink/60">
              Please describe your personal experience. Reviews containing disease-claim language or references to other websites will be filtered for compliance review.
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
