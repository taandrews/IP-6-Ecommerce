import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const region = process.env.AWS_REGION ?? "us-east-1";

export const sesClient = new SESClient({
  region,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

const FROM = process.env.SES_FROM_EMAIL ?? "hello@ip6original.com";
const REPLY_TO = process.env.SES_REPLY_TO ?? "support@ip6original.com";

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const cmd = new SendEmailCommand({
    Source: FROM,
    ReplyToAddresses: [REPLY_TO],
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Charset: "UTF-8", Data: subject },
      Body: {
        Html: { Charset: "UTF-8", Data: html },
        ...(text ? { Text: { Charset: "UTF-8", Data: text } } : {}),
      },
    },
  });
  return sesClient.send(cmd);
}

export const emailTemplates = {
  orderConfirmation: (name: string, orderId: string, total: string, eta: string) => ({
    subject: `Order ${orderId} confirmed — IP-6 Research`,
    html: baseEmail(`
      <h1>Thank you, ${escapeHtml(name)}.</h1>
      <p>Your order <strong>${escapeHtml(orderId)}</strong> has been received.</p>
      <p><strong>Total:</strong> ${escapeHtml(total)}</p>
      <p><strong>Estimated delivery:</strong> ${escapeHtml(eta)}</p>
      <p>We'll send tracking details as soon as your package ships.</p>
    `),
  }),
  shippingNotification: (name: string, orderId: string, tracking: string, carrier: string) => ({
    subject: `Your IP-6 order ${orderId} has shipped`,
    html: baseEmail(`
      <h1>On its way, ${escapeHtml(name)}.</h1>
      <p>Order <strong>${escapeHtml(orderId)}</strong> has shipped via ${escapeHtml(carrier)}.</p>
      <p><strong>Tracking:</strong> ${escapeHtml(tracking)}</p>
    `),
  }),
  subscriptionRenewalReminder: (name: string, product: string, chargeDate: string) => ({
    subject: `Upcoming renewal — ${product}`,
    html: baseEmail(`
      <h1>Heads up, ${escapeHtml(name)}.</h1>
      <p>Your ${escapeHtml(product)} subscription renews on ${escapeHtml(chargeDate)}.</p>
      <p>Need to pause or change frequency? Manage your subscription in your account dashboard.</p>
    `),
  }),
  subscriptionChargeSuccess: (name: string, product: string, amount: string) => ({
    subject: `Payment received — ${product}`,
    html: baseEmail(`
      <h1>Thank you, ${escapeHtml(name)}.</h1>
      <p>We've successfully charged ${escapeHtml(amount)} for your ${escapeHtml(product)} subscription.</p>
    `),
  }),
  subscriptionChargeFailed: (name: string, product: string) => ({
    subject: `Payment issue — ${product}`,
    html: baseEmail(`
      <h1>Hi ${escapeHtml(name)},</h1>
      <p>We had trouble charging your payment method for ${escapeHtml(product)}.</p>
      <p>Please update your payment method in your account to avoid a lapse in delivery.</p>
    `),
  }),
  subscriptionCancelled: (name: string, product: string) => ({
    subject: `${product} subscription cancelled`,
    html: baseEmail(`
      <h1>Cancelled, ${escapeHtml(name)}.</h1>
      <p>Your ${escapeHtml(product)} subscription has been cancelled. No further charges will occur.</p>
    `),
  }),
  passwordReset: (code: string) => ({
    subject: "Reset your IP-6 password",
    html: baseEmail(`
      <h1>Password reset</h1>
      <p>Use this code to reset your password: <strong style="font-size:24px;letter-spacing:2px;">${escapeHtml(code)}</strong></p>
      <p>If you didn't request this, ignore this email.</p>
    `),
  }),
};

function baseEmail(body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>IP-6 Research</title></head>
<body style="font-family:system-ui,Arial,sans-serif;color:#1A1A1A;max-width:560px;margin:0 auto;padding:24px;">
  <div style="border-bottom:2px solid #1B4332;padding-bottom:12px;margin-bottom:24px;">
    <strong style="color:#1B4332;font-size:20px;">IP-6 Research, Inc.</strong>
  </div>
  ${body}
  <hr style="margin:32px 0;border:none;border-top:1px solid #EFE8DB;">
  <p style="font-size:12px;color:#666;">IP-6 Research, Inc. · ip6original.com</p>
</body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
