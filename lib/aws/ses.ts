import "server-only";
import { awsRegion } from "./region";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { EMAIL } from "@/lib/email-addresses";

const region = awsRegion();

export const sesClient = new SESClient({
  region,
  ...(process.env.SES_ENDPOINT ? { endpoint: process.env.SES_ENDPOINT } : {}),
});

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com").replace(/\/$/, "");

/** Mailbox each message is sent from; the domain is the SES identity of this environment. */
export type Sender = "orders" | "privacy" | "hello";

const DEFAULT_REPLY_TO: Record<Sender, string> = {
  orders: EMAIL.support,
  privacy: EMAIL.privacy,
  hello: EMAIL.hello,
};

// SES only sends from the domain verified for this environment (ip6original.com in production,
// staging.ip6original.com in staging), so the domain comes from SES_FROM_EMAIL.
function fromAddress(sender: Sender, name: string) {
  const domain = process.env.SES_FROM_EMAIL?.split("@")[1];
  if (!domain) throw new Error("SES_FROM_EMAIL must be configured");
  return `${name} <${sender}@${domain}>`;
}

export interface SendOptions {
  sender?: Sender;
  /** Display name on the From line. */
  fromName?: string;
  /** Defaults to the inbox that answers for the sender (support@ for orders@). */
  replyTo?: string;
  text?: string;
}

export async function sendEmail(to: string, subject: string, html: string, opts: SendOptions = {}) {
  const sender = opts.sender ?? "orders";
  return sesClient.send(
    new SendEmailCommand({
      Source: fromAddress(sender, opts.fromName ?? "IP6 Original"),
      // Routes every message through the SES configuration set (TLS, suppression list, bounce alerts).
      ...(process.env.SES_CONFIGURATION_SET ? { ConfigurationSetName: process.env.SES_CONFIGURATION_SET } : {}),
      ReplyToAddresses: [opts.replyTo ?? DEFAULT_REPLY_TO[sender]],
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Charset: "UTF-8", Data: subject.replace(/[\r\n]/g, " ") },
        Body: {
          Html: { Charset: "UTF-8", Data: html },
          ...(opts.text ? { Text: { Charset: "UTF-8", Data: opts.text } } : {}),
        },
      },
    }),
  );
}

/** Sends and logs failures without the recipient or body (no PII in logs). */
export async function sendEmailSafe(to: string, msg: { subject: string; html: string; sender?: Sender }, label: string) {
  try {
    await sendEmail(to, msg.subject, msg.html, { sender: msg.sender });
    return true;
  } catch (err) {
    console.error(`[ses] ${label} failed`, (err as Error).name);
    return false;
  }
}

export function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const e = escapeHtml;

interface EmailLine {
  name: string;
  variantLabel: string;
  qty: number;
  total: string;
}

function linesTable(lines: EmailLine[]) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #E8EDF3;">${e(l.name)}<br><span style="color:#666;">${e(
          l.variantLabel,
        )} · Qty ${l.qty}</span></td><td style="padding:6px 0;border-bottom:1px solid #E8EDF3;text-align:right;">${e(l.total)}</td></tr>`,
    )
    .join("")}</table>`;
}

export const emailTemplates = {
  orderConfirmation: (o: {
    name: string;
    orderId: string;
    lines: EmailLine[];
    subtotal: string;
    discount?: string;
    shipping: string;
    tax?: string;
    total: string;
    preorderNote?: string;
  }) => ({
    subject: `Order ${o.orderId} confirmed · IP6 Original`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Thank you, ${e(o.name)}.</h1>
      <p>Your order <strong>${e(o.orderId)}</strong> is confirmed.</p>
      ${linesTable(o.lines)}
      <p style="font-size:14px;">Subtotal: ${e(o.subtotal)}<br>${o.discount ? `Discount: -${e(o.discount)}<br>` : ""}Shipping: ${e(
        o.shipping,
      )}<br>${o.tax ? `Tax: ${e(o.tax)}<br>` : ""}<strong>Total: ${e(o.total)}</strong></p>
      ${o.preorderNote ? `<p>${e(o.preorderNote)}</p>` : ""}
      <p>We'll email tracking details when your package ships.</p>
    `),
  }),
  shippingNotification: (name: string, orderId: string, carrier: string, tracking: string, trackingUrl?: string) => ({
    subject: `Your IP6 Original order ${orderId} has shipped`,
    html: baseEmail(`
      <h1 style="font-size:22px;">On its way, ${e(name)}.</h1>
      <p>Order <strong>${e(orderId)}</strong> has shipped with ${e(carrier)}.</p>
      <p><strong>Tracking number:</strong> ${e(tracking)}</p>
      ${trackingUrl ? `<p><a href="${e(trackingUrl)}" style="color:#0B1F3A;">Track your package</a></p>` : ""}
    `),
  }),
  refundIssued: (name: string, orderId: string, amount: string) => ({
    subject: `Refund issued for order ${orderId} · IP6 Original`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Hi ${e(name)},</h1>
      <p>We've issued a refund of <strong>${e(amount)}</strong> for order ${e(orderId)}.</p>
      <p>It goes back to your original payment method. Banks usually take 5 to 10 business days to show it.</p>
    `),
  }),
  orderCancelled: (name: string, orderId: string) => ({
    subject: `Order ${orderId} cancelled · IP6 Original`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Hi ${e(name)},</h1>
      <p>Order <strong>${e(orderId)}</strong> has been cancelled. If you were charged, a refund email follows separately.</p>
    `),
  }),
  subscriptionRenewalReminder: (name: string, product: string, chargeDate: string, amount: string) => ({
    subject: `Your ${product} subscription renews on ${chargeDate}`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Hi ${e(name)},</h1>
      <p>Your ${e(product)} subscription renews on <strong>${e(chargeDate)}</strong> for <strong>${e(amount)}</strong>.</p>
      <p>To skip, pause or cancel before then, visit <a href="${SITE}/account/subscriptions" style="color:#0B1F3A;">your subscriptions</a>.</p>
    `),
  }),
  subscriptionChargeSuccess: (name: string, product: string, amount: string) => ({
    subject: `Payment received · ${product}`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Thank you, ${e(name)}.</h1>
      <p>We charged ${e(amount)} for your ${e(product)} subscription. Your next shipment is being prepared.</p>
    `),
  }),
  subscriptionChargeFailed: (name: string, product: string) => ({
    subject: `Payment issue · ${product}`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Hi ${e(name)},</h1>
      <p>We couldn't charge your payment method for ${e(product)}.</p>
      <p>Please update it from <a href="${SITE}/account/subscriptions" style="color:#0B1F3A;">your subscriptions</a> to keep your deliveries.</p>
    `),
  }),
  subscriptionCancelled: (name: string, product: string) => ({
    subject: `${product} subscription cancelled`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Cancelled, ${e(name)}.</h1>
      <p>Your ${e(product)} subscription is cancelled. There will be no further charges.</p>
    `),
  }),
  privacyVerify: (link: string, type: "export" | "delete") => ({
    sender: "privacy" as const,
    subject: `Confirm your ${type === "delete" ? "data deletion" : "data copy"} request · IP6 Original`,
    html: baseEmail(`
      <h1 style="font-size:22px;">Confirm your request</h1>
      <p>We received a request to ${type === "delete" ? "delete the personal data" : "send a copy of the personal data"} we hold for this email address.</p>
      <p><a href="${e(link)}" style="color:#0B1F3A;font-weight:600;">Confirm the request</a></p>
      <p>The link works for 48 hours. If you didn't make this request, ignore this email and nothing will happen.</p>
    `),
  }),
  privacyReceived: (type: "export" | "delete") => ({
    sender: "privacy" as const,
    subject: "We received your privacy request · IP6 Original",
    html: baseEmail(`
      <h1 style="font-size:22px;">Request confirmed</h1>
      <p>Your ${type === "delete" ? "deletion" : "data copy"} request is confirmed. We complete requests within 30 days and will email you when it's done.</p>
    `),
  }),
  privacyDeleted: () => ({
    sender: "privacy" as const,
    subject: "Your personal data has been deleted · IP6 Original",
    html: baseEmail(`
      <h1 style="font-size:22px;">Deletion complete</h1>
      <p>We've deleted your account and personal data. Records we must keep by law (for example tax records of past orders) no longer contain your name, email, phone or address.</p>
    `),
  }),
  privacyExportReady: () => ({
    sender: "privacy" as const,
    subject: "Your data copy is ready · IP6 Original",
    html: baseEmail(`
      <h1 style="font-size:22px;">Your data copy</h1>
      <p>Sign in at <a href="${SITE}/account/privacy" style="color:#0B1F3A;">${SITE.replace(/^https?:\/\//, "")}/account/privacy</a> to download it, or reply to this email if you no longer have an account and we'll send it securely.</p>
    `),
  }),
  staffPrivacyAlert: (type: "export" | "delete") => ({
    sender: "privacy" as const,
    subject: `New ${type} request in the admin portal`,
    html: baseEmail(`<p>A verified ${e(type)} request is waiting in Admin, Privacy requests. It must be completed within 30 days.</p>`),
  }),
};

function baseEmail(body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>IP6 Original</title></head>
<body style="font-family:system-ui,Arial,sans-serif;color:#0B1F3A;max-width:560px;margin:0 auto;padding:24px;background:#F7F9FB;">
  <div style="border-bottom:2px solid #C9A961;padding-bottom:12px;margin-bottom:24px;">
    <strong style="color:#0B1F3A;font-size:20px;">IP6 Original</strong>
  </div>
  ${body}
  <hr style="margin:32px 0;border:none;border-top:1px solid #E8EDF3;">
  <p style="font-size:12px;color:#666;">IP6 Original · <a href="${SITE}" style="color:#666;">ip6original.com</a> · <a href="${SITE}/legal/privacy" style="color:#666;">Privacy</a></p>
</body></html>`;
}
