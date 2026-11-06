import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { listAccounts } from "@/lib/aws/cognito";
import { sealEmail } from "@/lib/admin/seal";
import { maskEmail, maskName } from "@/lib/admin/pii";
import { Empty, Notice, PageHeader, Table } from "@/components/admin/ui";
import { CustomerSearch } from "./CustomerSearch";

export const metadata = { title: "Customers" };

export default async function CustomersPage(props: { searchParams: Promise<{ cursor?: string }> }) {
  const searchParams = await props.searchParams;
  const staff = await requireStaffPage("customers:read");
  const pii = can(staff.role, "customers:pii");
  let accounts: Awaited<ReturnType<typeof listAccounts>>["accounts"] = [];
  let cursor: string | undefined;
  let error = false;
  try {
    const page = await listAccounts({ cursor: searchParams.cursor && searchParams.cursor.length < 2048 ? searchParams.cursor : undefined, limit: 25 });
    accounts = page.accounts;
    cursor = page.cursor;
  } catch (err) {
    console.error("[admin] customers list failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        intro="Customer accounts, plus guest checkouts found by email. Every view of a customer's details is recorded in the activity log."
      />
      {!pii ? <Notice tone="info">Your role shows masked names and emails, so search needs the full email address.</Notice> : null}
      <CustomerSearch />
      {error ? (
        <Notice tone="bad">Accounts couldn't be loaded. Check the customer user pool settings.</Notice>
      ) : accounts.length === 0 ? (
        <Empty>No customer accounts yet.</Empty>
      ) : (
        <Table head={["Name", "Email", "Joined", "Status", ""]} minWidth={640}>
          {accounts.map((a) => (
            <tr key={a.username}>
              <td className="px-4 py-3">{pii ? a.name ?? "" : maskName(a.name)}</td>
              <td className="px-4 py-3">{pii ? a.email : maskEmail(a.email)}</td>
              <td className="px-4 py-3">{a.createdAt?.slice(0, 10)}</td>
              <td className="px-4 py-3">{a.status === "CONFIRMED" ? "Verified" : a.status === "UNCONFIRMED" ? "Not verified" : a.status}</td>
              <td className="px-4 py-3 text-right">
                <Link className="underline text-navy-800" href={`/admin/customers/view?k=${encodeURIComponent(sealEmail(a.email))}`}>View</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {cursor ? (
        <Link className="btn-secondary text-sm" href={`/admin/customers?cursor=${encodeURIComponent(cursor)}`}>More</Link>
      ) : null}
    </div>
  );
}
