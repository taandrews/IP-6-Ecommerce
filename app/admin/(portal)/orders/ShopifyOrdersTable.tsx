import { Empty, Pill, Table } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { OrderSummary } from "@/lib/shopify/admin";
import type { Currency } from "@/types";

/** Orders as Shopify reports them; each row opens the order in Shopify admin, where it is fulfilled or refunded. */
export function ShopifyOrdersTable({ orders }: { orders: OrderSummary[] }) {
  if (!orders.length) return <Empty>No orders yet.</Empty>;
  return (
    <Table head={["Order", "Date", "Customer", "Total", "Payment", "Fulfillment"]} minWidth={720}>
      {orders.map((o) => (
        <tr key={o.id}>
          <td className="px-4 py-3 whitespace-nowrap">
            <a className="underline text-navy-800" href={o.url} target="_blank" rel="noopener noreferrer">
              {o.name}
            </a>
            {o.test ? (
              <span className="ml-2">
                <Pill>Test</Pill>
              </span>
            ) : null}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">{o.createdAt.slice(0, 10)}</td>
          <td className="px-4 py-3">{o.customer}</td>
          <td className="px-4 py-3 tabular-nums">{formatPrice(o.totalCents, o.currency as Currency)}</td>
          <td className="px-4 py-3 capitalize">{o.financialStatus || "pending"}</td>
          <td className="px-4 py-3 capitalize">
            <Pill tone={o.fulfillmentStatus === "fulfilled" ? "good" : o.fulfillmentStatus === "unfulfilled" ? "warn" : "neutral"}>{o.fulfillmentStatus}</Pill>
          </td>
        </tr>
      ))}
    </Table>
  );
}
