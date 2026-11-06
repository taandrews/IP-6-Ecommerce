import { z } from "zod";
import { MAX_LINES, MAX_QTY_PER_LINE } from "@/lib/pricing/quote";

export const CurrencySchema = z.enum(["USD", "CAD", "GBP", "AUD", "EUR", "INR"]);

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || undefined);

export const AddressSchema = z.object({
  name: text(120),
  company: optionalText(120),
  line1: text(200),
  line2: optionalText(200),
  city: text(120),
  region: z.string().trim().max(120).default(""),
  postalCode: text(20),
  country: z.string().trim().length(2).transform((c) => c.toUpperCase()),
  phone: optionalText(40),
});

export const RequestedLineSchema = z.object({
  variantId: z.string().min(1).max(80),
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
  subscriptionCycleDays: z.number().int().positive().max(365).optional(),
});

export const CheckoutInputSchema = z.object({
  email: z.string().trim().email().max(254),
  address: AddressSchema,
  items: z.array(RequestedLineSchema).min(1).max(MAX_LINES),
  currency: CurrencySchema,
  shippingRateId: z.string().max(40).optional(),
  discountCode: z.string().max(40).optional().nullable(),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
