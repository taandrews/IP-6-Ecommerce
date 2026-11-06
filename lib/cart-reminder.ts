import "server-only";
import crypto from "node:crypto";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailTemplates, sendEmail } from "@/lib/aws/ses";
import { emailKey, listOrdersByEmail, PAID_STATUSES, setOrderStatus } from "@/lib/data/orders";
import { formTokenKeys } from "@/lib/form-token";
import { formatPrice } from "@/lib/utils";
import type { OrderRecord } from "@/types/records";

/**
 * Abandoned-checkout reminder. A shopper who ticks "Email me a link to my
 * cart" at checkout and doesn't pay gets one email when the checkout expires,
 * with a signed link that refills their cart. Never more than one a day per
 * address, never after they've bought, never after they opt out.
 *
 * It's a commercial email, so US law (CAN-SPAM) requires the sender's postal
 * address in it: nothing is offered or sent until BUSINESS_POSTAL_ADDRESS is
 * set to the company's verified mailing address.
 */

/** The verified mailing address shown in the reminder, or null (reminders off). */
export function reminderPostalAddress(): string | null {
  const a = process.env.BUSINESS_POSTAL_ADDRESS?.trim();
  return a ? a : null;
}

export function cartRemindersEnabled() {
  return reminderPostalAddress() !== null;
}

const RESTORE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Opt-out links keep working well past the 30 days the law asks for (keys rotate monthly; the previous one is still accepted). */
const UNSUBSCRIBE_TTL_MS = 60 * 24 * 60 * 60 * 1000;
const ONE_A_DAY_SEC = 24 * 60 * 60;

const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const optOutKey = (email: string) => `cartreminder_optout_${hash(emailKey(email))}`;

function mac(key: string, purpose: string, subject: string, exp: number) {
  return crypto.createHmac("sha256", key).update(`${purpose}|${subject}|${exp}`).digest("base64url");
}

async function issue(purpose: string, subject: string, ttlMs: number) {
  const [key] = await formTokenKeys();
  const exp = Date.now() + ttlMs;
  return `${exp}.${mac(key!, purpose, subject, exp)}`;
}

async function check(purpose: string, subject: string, token: unknown) {
  if (typeof token !== "string" || token.length > 200) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() || !sig) return false;
  const a = Buffer.from(sig);
  return (await formTokenKeys()).some((key) => {
    const b = Buffer.from(mac(key, purpose, subject, exp));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export const checkRestoreToken = (orderId: string, token: unknown) => check("cart", orderId, token);
export const checkUnsubscribeToken = (email: string, token: unknown) => check("cart-unsub", emailKey(email), token);

export async function optOutOfCartReminders(email: string) {
  const now = new Date().toISOString();
  // Keyed by a hash of the address, so the record holds no email.
  await docClient.send(new PutCommand({ TableName: TABLES.Users, Item: { userId: optOutKey(email), optedOutAt: now, updatedAt: now } }));
}

async function optedOut(email: string) {
  const res = await docClient.send(new GetCommand({ TableName: TABLES.Users, Key: { userId: optOutKey(email) } }));
  return Boolean(res.Item);
}

/** At most one reminder a day per address, even across several abandoned checkouts. */
async function claimDailySlot(email: string) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLES.RateLimits,
        Item: { key: `cartreminder#${hash(emailKey(email))}`, expiresAt: Math.floor(Date.now() / 1000) + ONE_A_DAY_SEC },
        ConditionExpression: "attribute_not_exists(#k)",
        ExpressionAttributeNames: { "#k": "key" },
      }),
    );
    return true;
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export type ReminderOutcome = "sent" | "disabled" | "not_requested" | "opted_out" | "bought_since" | "already_today";

/**
 * Sends the reminder for an order whose checkout just expired unpaid. `site`
 * is the configured site origin (links never come from a request).
 */
export async function sendCartReminder(order: OrderRecord, site: string): Promise<ReminderOutcome> {
  const postal = reminderPostalAddress();
  if (!postal) return "disabled";
  if (!order.cartReminder || order.cartReminderSentAt) return "not_requested";
  if (await optedOut(order.email)) return "opted_out";
  const since = order.createdAt;
  const bought = (await listOrdersByEmail(order.email, 50)).some((o) => o.orderId !== order.orderId && o.createdAt >= since && PAID_STATUSES.includes(o.status));
  if (bought) return "bought_since";
  if (!(await claimDailySlot(order.email))) return "already_today";

  const [restore, unsub] = await Promise.all([issue("cart", order.orderId, RESTORE_TTL_MS), issue("cart-unsub", emailKey(order.email), UNSUBSCRIBE_TTL_MS)]);
  const restoreLink = `${site}/cart/restore?o=${encodeURIComponent(order.orderId)}&t=${encodeURIComponent(restore)}`;
  const unsubLink = `${site}/cart/reminders?e=${encodeURIComponent(order.email)}&t=${encodeURIComponent(unsub)}`;
  const msg = emailTemplates.cartReminder({
    name: firstName(order.customerName),
    lines: order.items.map((l) => ({ name: l.name, variantLabel: l.variantLabel, qty: l.qty, total: formatPrice(l.lineTotalCents, order.currency) })),
    restoreLink,
    unsubscribeLink: unsubLink,
    postalAddress: postal,
  });
  try {
    await sendEmail(order.email, msg.subject, msg.html);
  } catch (err) {
    // Free the day's slot so Stripe's retry of the event can send it.
    await docClient.send(new DeleteCommand({ TableName: TABLES.RateLimits, Key: { key: `cartreminder#${hash(emailKey(order.email))}` } })).catch(() => undefined);
    throw err;
  }
  await setOrderStatus(order.orderId, order.status, { cartReminderSentAt: new Date().toISOString() });
  return "sent";
}
