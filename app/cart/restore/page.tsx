import type { Metadata } from "next";
import Link from "next/link";
import { checkRestoreToken } from "@/lib/cart-reminder";
import { getOrder } from "@/lib/data/orders";
import { getCatalogFresh } from "@/lib/data/catalog";
import type { CartLine } from "@/types";
import { RestoreCart } from "./RestoreCart";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * "Return to my cart" from the reminder email. The signed link names the
 * order; its items go back in the cart at today's prices and availability.
 */
export default async function RestorePage(props: { searchParams: Promise<{ o?: string; t?: string }> }) {
  const { o, t } = await props.searchParams;
  const orderId = typeof o === "string" && /^IP6-[A-Z0-9]{6,20}$/.test(o) ? o : null;
  const order = orderId && (await checkRestoreToken(orderId, t)) ? await getOrder(orderId) : null;
  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-display-md text-forest-800 mb-4">This link has expired</h1>
        <p className="text-ink/70 mb-6">Cart links work for 7 days. Your items are still in the shop.</p>
        <Link href="/shop" className="btn-primary">Browse products</Link>
      </div>
    );
  }
  const catalog = await getCatalogFresh();
  const lines: CartLine[] = [];
  for (const item of order.items) {
    const product = catalog.find((p) => p.variants.some((v) => v.id === item.variantId));
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant || !variant.inStock || product.comingSoon) continue;
    const cycle = item.subscriptionCycleDays ? product.subscriptionCycles.find((c) => c.days === item.subscriptionCycleDays) : undefined;
    if (item.subscriptionCycleDays && !cycle) continue;
    lines.push({
      sku: variant.sku,
      variantId: variant.id,
      name: product.name,
      variantLabel: [variant.name, variant.size].filter(Boolean).join(" · "),
      image: variant.image?.url ?? product.images[0]?.url ?? "",
      qty: item.qty,
      unitPriceCents: variant.priceCents.USD,
      currency: "USD",
      ...(cycle ? { subscription: { cycleDays: cycle.days, discountPct: cycle.discountPct } } : {}),
    });
  }
  return <RestoreCart lines={lines} />;
}
