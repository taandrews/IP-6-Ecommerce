import { NextResponse } from "next/server";
import { z } from "zod";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailKey } from "@/lib/data/orders";
import { newsletterKey } from "@/lib/data/customers";
import { requestConfirmation } from "@/lib/data/confirmations";
import { getSessionUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { checkFormToken, formTokenKeys, issueFormToken } from "@/lib/form-token";
import { QUIZ_ANSWERS } from "@/lib/quiz";

export const runtime = "nodejs";

/** The exact wording shown next to the sign-up checkbox; stored as proof of consent. */
const CONSENT_VERSION = "2026-10-20";
/** The pre-order pop-up's wording, which also covers saving the quiz answers. */
const QUIZ_CONSENT_VERSION = "2026-10-29";

/** Only the quiz's own questions and answers are accepted. */
const Quiz = z
  .record(z.string(), z.string())
  .refine((q) => Object.entries(q).every(([k, v]) => QUIZ_ANSWERS[k]?.includes(v)), "unknown quiz answer");

const Body = z.object({
  email: z.string().trim().email().max(254),
  consent: z.literal(true),
  source: z.enum(["prebook_popup", "footer", "account"]).default("prebook_popup"),
  quiz: Quiz.optional(),
  /** Turnstile token, for a new sign-up. */
  captcha: z.string().max(2048).optional(),
  /** From an earlier sign-up response, for saving more quiz answers. */
  token: z.string().max(200).optional(),
});

/** Unconfirmed sign-ups are deleted after this long (DynamoDB TTL). */
const PENDING_TTL_SECONDS = 60 * 60 * 24 * 30;

const conditionFailed = (err: unknown) => (err as Error).name === "ConditionalCheckFailedException";

/**
 * Newsletter sign-up with double opt-in. A new sign-up must pass the CAPTCHA;
 * it is saved as pending and a confirmation link is emailed, and only the
 * click puts the address on the list. Someone signed in with that verified
 * email is confirmed at once. The reply carries a short-lived token so the
 * pre-order quiz can add its answers without a second CAPTCHA. Answers never
 * overwrite those already on a confirmed sign-up, unless it's the owner.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "newsletter", 10)) ?? (await limitByIp(req, "newsletter-hour", 40, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please tick the box to agree to emails." }, { status: 400 });
  const { email, source, quiz, captcha, token } = parsed.data;
  const keys = await formTokenKeys();
  const followUp = checkFormToken(keys, emailKey(email), token);
  if (!followUp && !(await verifyCaptcha(captcha, req))) {
    return NextResponse.json({ error: "Please complete the check and try again.", captcha: true }, { status: 400 });
  }
  const user = await getSessionUser().catch(() => null);
  const own = Boolean(user?.emailVerified && emailKey(user.email) === emailKey(email));
  const Key = { userId: newsletterKey(email) };
  const now = new Date().toISOString();
  const consentVersion = source === "prebook_popup" ? QUIZ_CONSENT_VERSION : CONSENT_VERSION;
  try {
    if (!followUp) {
      const existing = (await docClient.send(new GetCommand({ TableName: TABLES.Users, Key, ConsistentRead: true }))).Item;
      if (own) {
        // Signed in with this verified email: that already proves ownership.
        await docClient.send(
          new UpdateCommand({
            TableName: TABLES.Users,
            Key,
            UpdateExpression: "SET #email = :email, #nl = :t, #ca = :now, #cv = :cv, #cf = :now, #src = :src, #cr = if_not_exists(#cr, :now), #up = :now REMOVE #un, #exp",
            ExpressionAttributeNames: { "#email": "email", "#nl": "newsletter", "#ca": "consentedAt", "#cv": "consentVersion", "#cf": "confirmedAt", "#src": "source", "#cr": "createdAt", "#up": "updatedAt", "#un": "unsubscribedAt", "#exp": "expiresAt" },
            ExpressionAttributeValues: { ":email": emailKey(email), ":t": true, ":now": now, ":cv": consentVersion, ":src": source },
          }),
        );
      } else if (existing?.newsletter !== true) {
        // New or not yet confirmed: keep it pending and email the link.
        await docClient.send(
          new UpdateCommand({
            TableName: TABLES.Users,
            Key,
            // An opt-out marker (someone who unsubscribed) is kept; anything else unconfirmed expires.
            UpdateExpression: `SET #email = :email, #nl = if_not_exists(#nl, :f), #rq = :now, #src = if_not_exists(#src, :src), #cr = if_not_exists(#cr, :now), #up = :now${existing?.unsubscribedAt ? "" : ", #exp = :exp"}`,
            ExpressionAttributeNames: { "#email": "email", "#nl": "newsletter", "#rq": "requestedAt", "#src": "source", "#cr": "createdAt", "#up": "updatedAt", ...(existing?.unsubscribedAt ? {} : { "#exp": "expiresAt" }) },
            ExpressionAttributeValues: {
              ":email": emailKey(email),
              ":f": false,
              ":now": now,
              ":src": source,
              ...(existing?.unsubscribedAt ? {} : { ":exp": Math.floor(Date.now() / 1000) + PENDING_TTL_SECONDS }),
            },
          }),
        );
        await requestConfirmation(req, "newsletter", email, consentVersion);
      }
    }
    if (quiz && Object.keys(quiz).length) {
      await docClient
        .send(
          new UpdateCommand({
            TableName: TABLES.Users,
            Key,
            UpdateExpression: "SET #quiz = :quiz, #qa = :now",
            // A confirmed sign-up's answers are only replaced by its owner.
            ConditionExpression: own ? "attribute_exists(userId)" : "attribute_exists(userId) AND (#nl <> :t OR attribute_not_exists(#quiz))",
            ExpressionAttributeNames: { "#quiz": "quiz", "#qa": "quizAt", ...(own ? {} : { "#nl": "newsletter" }) },
            ExpressionAttributeValues: { ":quiz": quiz, ":now": now, ...(own ? {} : { ":t": true }) },
          }),
        )
        .catch((err) => {
          if (!conditionFailed(err)) throw err;
        });
    }
    // The same reply whether the address was new, pending or already confirmed.
    return NextResponse.json({ ok: true, token: issueFormToken(keys[0]!, emailKey(email)) });
  } catch (err) {
    console.error("[newsletter] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}
