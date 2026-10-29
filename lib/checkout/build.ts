import "server-only";
import type Stripe from "stripe";
import { getCatalogFresh } from "@/lib/data/catalog";
import { getPreorderSettingsFresh } from "@/lib/data/settings";
import { checkDiscount } from "@/lib/data/discounts";
import { DISCOUNT_MESSAGES, type DiscountCheck } from "@/lib/pricing/discount";
import { finishQuote, priceLines, QUOTE_MESSAGES, shippingOptions, type Quote } from "@/lib/pricing/quote";
import { getStripe, STRIPE_TAX_ENABLED } from "@/lib/stripe/server";
import type { ShippingRate } from "@/lib/shipping";
import type { CheckoutInput } from "./schema";
import { ADDRESS_BLOCK_MESSAGES, addressBlock, type AddressBlock } from "@/lib/countries";

export interface BuiltQuote {
  quote: Quote | null;
  rates: ShippingRate[];
  discount: DiscountCheck | null;
  discountMessage?: string;
  taxCalculationId?: string;
  error?: string;
  /** Set when the shipping address is outside the countries we sell to. */
  blocked?: AddressBlock;
}

/**
 * Prices a checkout entirely on the server. Used by the quote endpoint (to
 * show totals) and the payment endpoint (to set the amount Stripe charges).
 */
export async function buildQuote(input: CheckoutInput): Promise<BuiltQuote> {
  // Sales gate: the shipping address decides, never the visitor's IP country.
  const blocked = addressBlock(input.address);
  if (blocked) return { quote: null, rates: [], discount: null, error: ADDRESS_BLOCK_MESSAGES[blocked], blocked };
  if (input.currency !== "USD") {
    return { quote: null, rates: [], discount: null, error: "Prices are in US dollars. Please remove the items from your cart and add them again." };
  }
  const [catalog, preorder] = await Promise.all([getCatalogFresh(), getPreorderSettingsFresh()]);
  const priced = priceLines(
    catalog,
    input.items.map((i) => ({ variantId: i.variantId, qty: i.qty, subscriptionCycleDays: i.subscriptionCycleDays })),
    input.currency,
    preorder,
  );
  if (!priced.ok) return { quote: null, rates: [], discount: null, error: QUOTE_MESSAGES[priced.error.code] };

  let discount: DiscountCheck | null = null;
  if (input.discountCode?.trim()) {
    discount = await checkDiscount(input.discountCode, {
      subtotalCents: priced.value.subtotalCents,
      currency: input.currency,
      email: input.email,
    });
  }
  const discountApplied = discount?.ok ? { code: discount.code, amountCents: discount.amountCents } : null;
  const discountMessage = discount && !discount.ok ? DISCOUNT_MESSAGES[discount.reason] : undefined;

  const rates = shippingOptions(priced.value, discountApplied?.amountCents ?? 0, input.currency, input.address.country, input.address.postalCode);
  if (rates.length === 0) return { quote: null, rates, discount, discountMessage, error: QUOTE_MESSAGES.no_shipping };
  const rateId = input.shippingRateId ?? rates[0]!.id;

  const untaxed = finishQuote(priced.value, input.currency, discountApplied, rates, rateId);
  if (!untaxed.ok) return { quote: null, rates, discount, discountMessage, error: QUOTE_MESSAGES[untaxed.error.code] };

  if (!STRIPE_TAX_ENABLED) return { quote: untaxed.value, rates, discount, discountMessage };

  const tax = await calculateTax(untaxed.value, input);
  const final = finishQuote(priced.value, input.currency, discountApplied, rates, rateId, tax.amountCents);
  if (!final.ok) return { quote: null, rates, discount, discountMessage, error: QUOTE_MESSAGES[final.error.code] };
  return { quote: final.value, rates, discount, discountMessage, taxCalculationId: tax.calculationId };
}

/**
 * Sales tax through Stripe Tax. Discounts are spread across lines in
 * proportion to their value so the taxable amounts add up exactly.
 */
async function calculateTax(q: Quote, input: CheckoutInput) {
  const stripe = await getStripe();
  let remaining = q.discountCents;
  const lines = q.lines.map((l, i) => {
    const share = i === q.lines.length - 1 ? remaining : Math.round((q.discountCents * l.lineTotalCents) / Math.max(q.subtotalCents, 1));
    remaining -= share;
    return {
      amount: Math.max(0, l.lineTotalCents - share),
      reference: `${l.variantId}${l.subscriptionCycleDays ? `-sub${l.subscriptionCycleDays}` : ""}`,
      quantity: l.qty,
    };
  });
  const calc: Stripe.Tax.Calculation = await stripe.tax.calculations.create({
    currency: q.currency.toLowerCase(),
    line_items: lines,
    shipping_cost: { amount: q.shipping.amountCents },
    customer_details: {
      address: {
        line1: input.address.line1,
        line2: input.address.line2 ?? undefined,
        city: input.address.city,
        state: input.address.region || undefined,
        postal_code: input.address.postalCode,
        country: input.address.country,
      },
      address_source: "shipping",
    },
  });
  return { amountCents: calc.tax_amount_exclusive, calculationId: calc.id ?? undefined };
}
