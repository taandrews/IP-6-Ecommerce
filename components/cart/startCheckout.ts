import type { CartLine } from "@/types";

/**
 * Sends the cart to /api/checkout, which builds a Shopify cart, then moves
 * the browser to Shopify's hosted checkout. Throws a message fit to show.
 */
export async function startCheckout(lines: CartLine[]): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: lines.map((l) => ({ variantId: l.variantId, qty: l.qty, ...(l.subscription ? { cycleDays: l.subscription.cycleDays } : {}) })),
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new Error(body.error ?? "Checkout is unavailable right now. Please try again in a minute.");
  window.location.assign(body.url);
}
