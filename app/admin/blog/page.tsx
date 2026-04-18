import { ExternalLink } from "lucide-react";

export default function AdminBlogPage() {
  const studioUrl =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
      ? `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.sanity.studio`
      : null;

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="font-display text-display-md text-forest-800">Blog editor</h1>
      </header>
      <div className="card p-8 max-w-2xl">
        <p className="text-ink/80 leading-relaxed mb-6">
          Blog content is managed in Sanity Studio. Changes publish immediately to the site after saving in Studio.
        </p>
        {studioUrl ? (
          <a href={studioUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Open Sanity Studio <ExternalLink className="size-4" />
          </a>
        ) : (
          <p className="rounded-md bg-red-50 border border-red-200 text-danger text-sm p-3">
            Sanity is not configured. Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> in your environment.
          </p>
        )}
      </div>
    </>
  );
}
