import { DiscountManager } from "./DiscountManager";

export default function AdminDiscountsPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="font-display text-display-md text-forest-800">Discount codes</h1>
      </header>
      <DiscountManager />
    </>
  );
}
