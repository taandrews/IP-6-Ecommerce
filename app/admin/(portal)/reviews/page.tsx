import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { listReviewsByStatus } from "@/lib/data/reviews";
import { products } from "@/content/products";
import { Empty, Notice, PageHeader, Pill } from "@/components/admin/ui";
import { ReviewActions } from "./ReviewActions";
import type { ReviewStatus } from "@/types/records";

export const metadata = { title: "Reviews" };

const TABS: Array<{ s: ReviewStatus; label: string }> = [
  { s: "pending", label: "Waiting" },
  { s: "published", label: "Published" },
  { s: "rejected", label: "Rejected" },
];

export default async function ReviewsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireStaffPage("reviews:moderate");
  const status = TABS.find((t) => t.s === searchParams.status)?.s ?? "pending";
  let reviews: Awaited<ReturnType<typeof listReviewsByStatus>>["reviews"] = [];
  let error = false;
  try {
    reviews = (await listReviewsByStatus(status, undefined, 100)).reviews;
  } catch (err) {
    console.error("[admin] reviews failed", (err as Error).name);
    error = true;
  }
  const name = (sku: string) => products.find((p) => p.sku === sku)?.name ?? sku;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        intro="Nothing is shown on the site until it's approved here. Don't approve reviews that claim IP6 treats, cures or prevents a disease."
      />
      <nav className="flex gap-2">
        {TABS.map((t) => (
          <Link key={t.s} href={`/admin/reviews?status=${t.s}`} className={`rounded-full border px-3 py-1.5 text-sm ${t.s === status ? "bg-navy-800 text-surface border-navy-800" : "bg-surface border-cloud-300"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      {error ? <Notice tone="bad">Reviews couldn't be loaded. Check the Reviews table's status index is deployed.</Notice> : null}
      {reviews.length === 0 ? (
        <Empty>Nothing here.</Empty>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.reviewId} className="rounded-lg border border-cloud-300 bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <span>{r.authorName}</span>
                {r.verifiedPurchase ? <Pill tone="good">Verified buyer</Pill> : null}
                <span className="text-ink/55">· {name(r.sku)} · {r.createdAt.slice(0, 10)}</span>
              </div>
              <h3 className="mt-2 font-semibold text-navy-800">{r.title}</h3>
              <p className="mt-1 text-sm text-ink/80 whitespace-pre-wrap">{r.body}</p>
              {r.findings?.length ? (
                <div className="mt-3">
                  <Notice tone="warn">
                    Compliance check flagged: {r.findings.map((f) => f.message).join("; ")}
                  </Notice>
                </div>
              ) : null}
              {r.rejectReason ? <p className="mt-2 text-xs text-ink/55">Rejected: {r.rejectReason}</p> : null}
              <div className="mt-3">
                <ReviewActions sku={r.sku} reviewId={r.reviewId} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
