import { products } from "../content/products";
import type { Quote } from "../lib/pricing/quote";

// Exercise the real deployed pricing route. Never call the payment/order route.
async function main() {
  const target = process.argv[2];
  if (!target) throw new Error("Usage: npm run checkout:check -- <site-url>");
  const url = new URL(target);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Provide an http(s) site URL without credentials.");
  }
  const endpoint = new URL("/api/checkout/quote", url);
  const variants = products.filter((p) => !p.comingSoon).flatMap((p) => p.variants.filter((v) => v.inStock));
  if (!variants.length) throw new Error("No purchasable variants to check.");
  const address = {
    name: "Checkout Check", line1: "1600 Pennsylvania Avenue NW", city: "Washington",
    region: "DC", postalCode: "20500", country: "US",
  };
  let failures = 0;
  console.log(`Checking ${endpoint.origin}: pricing only, no orders or payments.`);
  for (const variant of variants) {
    for (const qty of [1, 2]) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: endpoint.origin },
          body: JSON.stringify({ email: "checkout-check@example.com", address, items: [{ variantId: variant.id, qty }], currency: "USD" }),
          signal: AbortSignal.timeout(60_000),
        });
        const data = await res.json() as { quote?: Quote; error?: string };
        if (!res.ok || !data.quote) throw new Error(`HTTP ${res.status}: ${data.error ?? "Missing quote"}`);
        const q = data.quote;
        if (q.lines.length !== 1 || q.lines[0]?.variantId !== variant.id || q.lines[0]?.qty !== qty || q.currency !== "USD") {
          throw new Error("Quote does not match the requested cart.");
        }
        const amounts = [q.subtotalCents, q.discountCents, q.shipping.amountCents, q.taxCents, q.totalCents];
        if (amounts.some((n) => !Number.isInteger(n) || n < 0) || q.totalCents <= 0 ||
          q.subtotalCents !== q.lines.reduce((sum, line) => sum + line.lineTotalCents, 0) ||
          q.totalCents !== q.subtotalCents - q.discountCents + q.shipping.amountCents + q.taxCents) {
          throw new Error("Quote totals are inconsistent.");
        }
        console.log(`PASS ${variant.id} x ${qty}: $${(q.totalCents / 100).toFixed(2)} total, $${(q.taxCents / 100).toFixed(2)} tax`);
      } catch (err) {
        failures += 1;
        console.error(`FAIL ${variant.id} x ${qty}: ${(err as Error).message}`);
      }
    }
  }
  if (failures) {
    console.error(`${failures} pricing checks failed. Do not treat checkout as ready.`);
    process.exitCode = 1;
  } else {
    console.log("Pricing checks passed. This does not verify card payments or webhook delivery; test those in Stripe sandbox.");
  }
}

main().catch((err: Error) => { console.error(err.message); process.exitCode = 1; });
