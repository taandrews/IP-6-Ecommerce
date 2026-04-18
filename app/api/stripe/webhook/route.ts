import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/server";
import { sendEmail, emailTemplates } from "@/lib/aws/ses";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { formatPrice } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Webhook error: ${(err as { message?: string })?.message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = String(pi.metadata.orderId ?? "");
        const email = String(pi.metadata.email ?? pi.receipt_email ?? "");
        if (orderId) {
          await docClient.send(
            new PutCommand({
              TableName: TABLES.Orders,
              Item: {
                orderId,
                email,
                status: "paid",
                totalCents: pi.amount,
                currency: pi.currency.toUpperCase(),
                stripePaymentIntentId: pi.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: pi.metadata,
              },
            }),
          );
          if (email) {
            const { subject, html } = emailTemplates.orderConfirmation(
              "there",
              orderId,
              formatPrice(pi.amount, pi.currency.toUpperCase() as never),
              "5–10 business days",
            );
            await sendEmail(email, subject, html).catch((e) =>
              console.error("[ses] order confirmation failed", e),
            );
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (typeof subId === "string") {
          await docClient.send(
            new UpdateCommand({
              TableName: TABLES.Subscriptions,
              Key: { subscriptionId: subId },
              UpdateExpression: "SET #s = :s, lastInvoiceId = :i, updatedAt = :u",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: {
                ":s": "active",
                ":i": invoice.id,
                ":u": new Date().toISOString(),
              },
            }),
          );
          if (invoice.customer_email) {
            const { subject, html } = emailTemplates.subscriptionChargeSuccess(
              "there",
              "your subscription",
              formatPrice(invoice.amount_paid, invoice.currency.toUpperCase() as never),
            );
            await sendEmail(invoice.customer_email, subject, html).catch(() => {});
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (typeof invoice.subscription === "string") {
          await docClient.send(
            new UpdateCommand({
              TableName: TABLES.Subscriptions,
              Key: { subscriptionId: invoice.subscription },
              UpdateExpression: "SET #s = :s, updatedAt = :u",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: {
                ":s": "past_due",
                ":u": new Date().toISOString(),
              },
            }),
          );
          if (invoice.customer_email) {
            const { subject, html } = emailTemplates.subscriptionChargeFailed(
              "there",
              "your subscription",
            );
            await sendEmail(invoice.customer_email, subject, html).catch(() => {});
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await docClient.send(
          new UpdateCommand({
            TableName: TABLES.Subscriptions,
            Key: { subscriptionId: sub.id },
            UpdateExpression: "SET #s = :s, updatedAt = :u",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: {
              ":s": "cancelled",
              ":u": new Date().toISOString(),
            },
          }),
        );
        break;
      }

      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[stripe] webhook handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}
