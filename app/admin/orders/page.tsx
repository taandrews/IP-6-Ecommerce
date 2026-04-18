import { OrdersTable } from "./OrdersTable";

export default function AdminOrdersPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="font-display text-display-md text-forest-800">Orders</h1>
      </header>
      <OrdersTable />
    </>
  );
}
