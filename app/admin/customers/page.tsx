import { CustomersTable } from "./CustomersTable";

export default function AdminCustomersPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="font-display text-display-md text-forest-800">Customers</h1>
      </header>
      <CustomersTable />
    </>
  );
}
