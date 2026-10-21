import { requireStaffPage } from "@/lib/admin/guard";
import { getBannerSettings, bannerIsLive } from "@/lib/data/settings";
import { Notice, PageHeader, Panel } from "@/components/admin/ui";
import { BannerForm } from "./BannerForm";

export const metadata = { title: "Site banner" };

export default async function BannerPage() {
  await requireStaffPage("banner:write");
  const banner = await getBannerSettings();
  return (
    <div className="space-y-6">
      <PageHeader title="Site banner" intro="A one-line announcement across the top of every storefront page on the Amplify site." />
      <Notice tone={bannerIsLive(banner) ? "good" : "neutral"}>{bannerIsLive(banner) ? "The banner is showing now." : "The banner is not showing."}</Notice>
      <Notice tone="info">The Shopify store's announcement bar is edited in Shopify's theme editor.</Notice>
      <Panel title="Banner">
        <BannerForm initial={banner} />
      </Panel>
    </div>
  );
}
