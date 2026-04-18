import { InventoryTable } from "./InventoryTable";
import { products } from "@/content/products";

// In production, fetch live from DynamoDB Inventory table.
function buildInitial() {
  return products.flatMap((p) =>
    p.variants.map((v) => ({
      sku: v.sku,
      name: `${p.name} · ${v.name} ${v.size}`,
      stock: 120,
      lowStockThreshold: 25,
    })),
  );
}

export default function InventoryPage() {
  const initial = buildInitial();
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="font-display text-display-md text-forest-800">Inventory</h1>
      </header>
      <InventoryTable initial={initial} />
    </>
  );
}
