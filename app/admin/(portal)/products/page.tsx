import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { getCatalogFresh, listInventory, listOverrides, DEFAULT_LOW_STOCK } from "@/lib/data/catalog";
import { products as base } from "@/content/products";
import { Notice, PageHeader } from "@/components/admin/ui";
import { VariantEditor } from "./VariantEditor";

export const metadata = { title: "Products and stock" };

export default async function ProductsPage() {
  const staff = await requireStaffPage("orders:read");
  let catalog = base;
  let stock: Awaited<ReturnType<typeof listInventory>> = [];
  let overrides: Awaited<ReturnType<typeof listOverrides>> = [];
  let error = false;
  try {
    [catalog, stock, overrides] = await Promise.all([getCatalogFresh(), listInventory(), listOverrides()]);
  } catch (err) {
    console.error("[admin] products failed", (err as Error).name);
    error = true;
  }
  const bySku = new Map(stock.map((s) => [s.sku, s]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products and stock"
        intro="Prices and availability apply to the Amplify store. Stock goes down automatically when an order is paid. Items without a stock count are treated as always available."
      />
      {error ? <Notice tone="bad">Saved prices and stock couldn't be loaded; showing catalog defaults.</Notice> : null}
      <Notice tone="info">The Shopify store keeps its own prices and inventory. Change those in Shopify admin.</Notice>
      {catalog.map((p) => (
        <section key={p.sku} className="rounded-lg border border-cloud-300 bg-surface">
          <div className="border-b border-cloud-300 px-5 py-3">
            <h2 className="font-semibold text-navy-800">{p.name}</h2>
            <p className="text-xs text-ink/55">{p.sku}</p>
          </div>
          <div className="divide-y divide-cloud-300">
            {p.variants.map((v) => {
              const inv = bySku.get(v.sku);
              const manualAvailable = overrides.find((o) => o.sku === p.sku)?.available?.[v.id] !== false;
              return (
                <VariantEditor
                  key={v.id}
                  productSku={p.sku}
                  variant={{ id: v.id, sku: v.sku, label: [v.name, v.size].filter(Boolean).join(" · "), prices: v.priceCents, inStock: v.inStock }}
                  manualAvailable={manualAvailable}
                  inventory={inv ? { stock: inv.stock, lowStockThreshold: inv.lowStockThreshold, allowBackorder: inv.allowBackorder, updatedAt: inv.updatedAt } : null}
                  defaultThreshold={DEFAULT_LOW_STOCK}
                  canPrice={can(staff.role, "products:write")}
                  canStock={can(staff.role, "inventory:write")}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
