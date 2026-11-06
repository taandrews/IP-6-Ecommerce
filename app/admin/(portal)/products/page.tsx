import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { getCatalogFresh, listOverrides } from "@/lib/data/catalog";
import { products as base } from "@/content/products";
import { Notice, PageHeader } from "@/components/admin/ui";
import { VariantEditor } from "./VariantEditor";

export const metadata = { title: "Products and prices" };

export default async function ProductsPage() {
  const staff = await requireStaffPage("orders:read");
  let catalog = base;
  let overrides: Awaited<ReturnType<typeof listOverrides>> = [];
  let error = false;
  try {
    [catalog, overrides] = await Promise.all([getCatalogFresh(), listOverrides()]);
  } catch (err) {
    console.error("[admin] products failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products and prices"
        intro="Prices and availability set here are what the store charges and shows. Stock is managed in Inventory."
      />
      {error ? <Notice tone="bad">Saved prices and stock couldn't be loaded; showing catalog defaults.</Notice> : null}
      {catalog.map((p) => (
        <section key={p.sku} className="rounded-lg border border-cloud-300 bg-surface">
          <div className="border-b border-cloud-300 px-5 py-3">
            <h2 className="font-semibold text-navy-800">{p.name}</h2>
            <p className="text-xs text-ink/55">{p.sku}</p>
          </div>
          <div className="divide-y divide-cloud-300">
            {p.variants.map((v) => {
              const manualAvailable = overrides.find((o) => o.sku === p.sku)?.available?.[v.id] !== false;
              return (
                <VariantEditor
                  key={v.id}
                  productSku={p.sku}
                  variant={{ id: v.id, sku: v.sku, label: [v.name, v.size].filter(Boolean).join(" · "), prices: v.priceCents, inStock: v.inStock }}
                  manualAvailable={manualAvailable}
                  canPrice={can(staff.role, "products:write")}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
