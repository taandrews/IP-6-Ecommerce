import { requireStaffPage } from "@/lib/admin/guard";
import { getCatalogFresh } from "@/lib/data/catalog";
import { SHOPIFY_ADMIN_URL } from "@/lib/shopify/admin";
import { PageHeader, Pill, Table } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products and stock" };

export default async function ProductsPage() {
  await requireStaffPage("orders:read");
  const catalog = await getCatalogFresh();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products and stock"
        intro="Prices, stock and subscription plans are set in Shopify and show on this site within a minute. Product descriptions, photos and FAQs on this site are part of the site itself."
        actions={
          <a className="btn-secondary text-sm" href={`${SHOPIFY_ADMIN_URL}/products`} target="_blank" rel="noopener noreferrer">
            Edit in Shopify
          </a>
        }
      />
      <Table head={["Product", "SKU", "Price", "Subscribe and save", "Status"]} minWidth={720}>
        {catalog.flatMap((p) =>
          p.variants.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-3">
                {p.name} · {v.size ?? v.name}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
              <td className="px-4 py-3 tabular-nums">{formatPrice(v.priceCents.USD, "USD")}</td>
              <td className="px-4 py-3 text-sm">
                {p.subscriptionCycles.length ? p.subscriptionCycles.map((c) => `every ${c.days} days, ${c.discountPct}% off`).join("; ") : "None"}
              </td>
              <td className="px-4 py-3">
                {!v.shopifyVariantId ? <Pill tone="bad">Not in Shopify</Pill> : v.inStock ? <Pill tone="good">Available</Pill> : <Pill tone="warn">Sold out</Pill>}
              </td>
            </tr>
          )),
        )}
      </Table>
    </div>
  );
}
