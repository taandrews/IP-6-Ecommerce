import { ExternalLink } from "lucide-react";
import { requireStaffPage } from "@/lib/admin/guard";
import { Notice, PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Blog editor" };

export default async function AdminBlogPage() {
  await requireStaffPage("banner:write");
  const id = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const studioUrl = id && /^[a-z0-9-]+$/.test(id) ? `https://${id}.sanity.studio` : null;
  return (
    <div className="space-y-6">
      <PageHeader title="Blog editor" intro="Blog posts are written in Sanity Studio, which has its own login." />
      <Panel>
        {studioUrl ? (
          <a href={studioUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Open Sanity Studio <ExternalLink className="size-4" />
          </a>
        ) : (
          <Notice tone="warn">Sanity isn't configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID in the Amplify environment.</Notice>
        )}
      </Panel>
    </div>
  );
}
