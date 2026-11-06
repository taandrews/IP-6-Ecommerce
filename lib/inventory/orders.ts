import "server-only";
import { appendOrderList } from "@/lib/data/orders";
import { refreshCatalog } from "@/lib/data/catalog";
import { checkLowStock } from "./alerts";
import { commit, hold, InventoryError, release, returnToStock, type Allocation } from "./store";

/** The bridge between orders and inventory. Order code calls these; they never decide prices. */

export async function holdForCheckout(orderId: string, lines: Array<{ sku: string; qty: number }>, country: string, until: Date) {
  await hold(orderId, lines, country, until);
}

export async function releaseOrder(orderId: string) {
  await release(orderId);
  refreshCatalog();
}

/** Turns a paid order's holds into sales (FEFO lots), notes any oversell for staff, and checks low stock. */
export async function sellPaidOrder(orderId: string, lines: Array<{ sku: string; qty: number }>) {
  const { oversold } = await commit(orderId, lines);
  if (oversold.length) {
    await appendOrderList(orderId, "notes", {
      at: new Date().toISOString(),
      by: "system",
      text: `Paid after its stock hold ended; sold anyway (${oversold.join(", ")}). Check stock before shipping.`,
    });
  }
  refreshCatalog();
  await checkLowStock(lines.map((l) => l.sku)).catch((err) => console.error("[inventory] low-stock check failed", (err as Error).name));
}

/** A renewal is already paid: hold if stock allows, then sell either way (never refuse a paid order). */
export async function sellNow(orderId: string, lines: Array<{ sku: string; qty: number }>, country: string) {
  try {
    await hold(orderId, lines, country, new Date(Date.now() + 15 * 60 * 1000));
  } catch (err) {
    if (!(err instanceof InventoryError)) throw err;
  }
  await sellPaidOrder(orderId, lines);
}

export async function returnOrderStock(orderId: string, allocations: Allocation[] | undefined, actor: string, reason: string) {
  if (!allocations?.length) return;
  await returnToStock(orderId, allocations, actor, reason);
  refreshCatalog();
}
