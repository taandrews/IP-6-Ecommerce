import { requireStaffPage } from "@/lib/admin/guard";
import { can } from "@/lib/auth/roles";
import { shopifyAdminUrl } from "@/lib/shopify/admin";
import { Notice, PageHeader } from "@/components/admin/ui";
import { CustomerSearch } from "./CustomerSearch";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const staff = await requireStaffPage("customers:read");
  const pii = can(staff.role, "customers:pii");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        intro="Customer accounts, orders and subscriptions are in Shopify. Find someone by email to see their Shopify record alongside this site's newsletter and waitlist sign-ups, and to handle privacy requests. Every view is recorded in the activity log."
        actions={
          <a className="btn-secondary text-sm" href={`${shopifyAdminUrl()}/customers`} target="_blank" rel="noopener noreferrer">
            All customers in Shopify
          </a>
        }
      />
      {!pii ? <Notice tone="info">Your role shows masked names and emails, so search needs the full email address.</Notice> : null}
      <CustomerSearch />
    </div>
  );
}
