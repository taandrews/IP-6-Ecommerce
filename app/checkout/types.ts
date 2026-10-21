import type { Currency } from "@/types";
import type { OrderLine } from "@/types/records";
import type { ShippingRate } from "@/lib/shipping";

/** Server-calculated quote, as returned by /api/checkout/quote. */
export interface ClientQuote {
  lines: OrderLine[];
  subtotalCents: number;
  hasSubscription: boolean;
  hasPreorder: boolean;
  currency: Currency;
  discountCode?: string;
  discountCents: number;
  shipping: ShippingRate;
  taxCents: number;
  totalCents: number;
}
