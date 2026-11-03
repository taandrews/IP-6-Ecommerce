import "server-only";
import { sesRegion } from "./region";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { EMAIL } from "@/lib/email-addresses";

const region = sesRegion();

export const sesClient = new SESClient({
  region,
  ...(process.env.SES_ENDPOINT ? { endpoint: process.env.SES_ENDPOINT } : {}),
});

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip6original.com").replace(/\/$/, "");

/**
 * Mailbox each message is sent from; the domain is the SES identity of this environment.
 * SES sends the site's own email (contact form, privacy requests, newsletter and
 * waitlist confirmations). Order, shipping, refund and subscription emails are
 * sent by Shopify.
 */
export type Sender = "privacy" | "hello";

const DEFAULT_REPLY_TO: Record<Sender, string> = {
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
  /** Defaults to the inbox that answers for the sender. */
  replyTo?: string;
  text?: string;
}

export async function sendEmail(to: string, subject: string, html: string, opts: SendOptions = {}) {
  const sender = opts.sender ?? "hello";
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

export const emailTemplates = {
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
  newsletterConfirm: (link: string) => ({
    sender: "hello" as const,
    subject: "Confirm your email · IP6 Original",
    html: baseEmail(`
      <h1 style="font-size:22px;">One click to finish</h1>
      <p>Someone, hopefully you, asked to get IP6 Original news and launch offers at this address.</p>
      <p><a href="${e(link)}" style="color:#0B1F3A;font-weight:600;">Yes, sign me up</a></p>
      <p>The link works for 48 hours. If this wasn't you, ignore this email and you won't hear from us.</p>
    `),
  }),
  waitlistConfirm: (link: string) => ({
    sender: "hello" as const,
    subject: "Confirm your launch alert · IP6 Original",
    html: baseEmail(`
      <h1 style="font-size:22px;">Confirm your launch alert</h1>
      <p>Someone, hopefully you, asked us to email this address when IP6 Original ships to their country.</p>
      <p><a href="${e(link)}" style="color:#0B1F3A;font-weight:600;">Yes, tell me at launch</a></p>
      <p>The link works for 48 hours. If this wasn't you, ignore this email and you won't hear from us.</p>
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
      <p>We'll send it to you securely in a separate message. Reply to this email if it hasn't arrived within two business days.</p>
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
