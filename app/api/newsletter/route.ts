import { NextResponse } from "next/server";
import { z } from "zod";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailKey } from "@/lib/data/orders";
import { newsletterKey } from "@/lib/data/customers";
import { getSessionUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { QUIZ_ANSWERS } from "@/lib/quiz";

export const runtime = "nodejs";

/** The exact wording shown next to the sign-up checkbox; stored as proof of consent. */
const CONSENT_VERSION = "2026-10-20";
/** The pre-order pop-up's wording, which also covers saving the quiz answers. */
const QUIZ_CONSENT_VERSION = "2026-10-29";
/** The pop-up saves the email, then the answers when the quiz ends; answers are only accepted within this window. */
const QUIZ_WINDOW_MS = 30 * 60 * 1000;

/** Only the quiz's own questions and answers are accepted. */
const Quiz = z
  .record(z.string(), z.string())
  .refine((q) => Object.entries(q).every(([k, v]) => QUIZ_ANSWERS[k]?.includes(v)), "unknown quiz answer");

const Body = z.object({
  email: z.string().trim().email().max(254),
  consent: z.literal(true),
  source: z.enum(["prebook_popup", "footer", "account"]).default("prebook_popup"),
  quiz: Quiz.optional(),
});

const conditionFailed = (err: unknown) => (err as Error).name === "ConditionalCheckFailedException";

/**
 * Anyone can type any email here and no confirmation email goes out yet, so a
 * stranger must not be able to change someone else's row: the first proof of
 * consent is kept, someone who unsubscribed is only signed up again by
 * themselves (signed in with that verified email), and quiz answers can only
 * be added in the minutes after the sign-up. The reply is the same either way.
 */
export async function POST(req: Request) {
  const limited = (await limitByIp(req, "newsletter", 10)) ?? (await limitByIp(req, "newsletter-hour", 40, 3600));
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please tick the box to agree to emails." }, { status: 400 });
  const { email, source, quiz } = parsed.data;
  const user = await getSessionUser().catch(() => null);
  const own = Boolean(user?.emailVerified && emailKey(user.email) === emailKey(email));
  const Key = { userId: newsletterKey(email) };
  const now = new Date().toISOString();
  try {
    const names: Record<string, string> = { "#email": "email", "#nl": "newsletter", "#ca": "consentedAt", "#cv": "consentVersion", "#src": "source", "#cr": "createdAt", "#up": "updatedAt", "#un": "unsubscribedAt" };
    const values: Record<string, unknown> = {
      ":email": emailKey(email),
      ":nl": true,
      ":cv": source === "prebook_popup" ? QUIZ_CONSENT_VERSION : CONSENT_VERSION,
      ":src": source,
      ":now": now,
    };
    const consent = own ? "#ca = :now, #cv = :cv, #src = :src" : "#ca = if_not_exists(#ca, :now), #cv = if_not_exists(#cv, :cv), #src = if_not_exists(#src, :src)";
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLES.Users,
          Key,
          UpdateExpression: `SET #email = :email, #nl = :nl, ${consent}, #cr = if_not_exists(#cr, :now), #up = :now REMOVE #un`,
          ...(own ? {} : { ConditionExpression: "attribute_not_exists(#nl) OR #nl = :nl" }),
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        }),
      );
    } catch (err) {
      // They unsubscribed earlier and this request isn't from them.
      if (conditionFailed(err)) return NextResponse.json({ ok: true });
      throw err;
    }
    if (quiz && Object.keys(quiz).length) {
      await docClient
        .send(
          new UpdateCommand({
            TableName: TABLES.Users,
            Key,
            UpdateExpression: "SET #quiz = :quiz, #qa = :now",
            ConditionExpression: own ? "#nl = :nl" : "#nl = :nl AND (attribute_not_exists(#quiz) OR #cr > :recent)",
            ExpressionAttributeNames: { "#quiz": "quiz", "#qa": "quizAt", "#nl": "newsletter", ...(own ? {} : { "#cr": "createdAt" }) },
            ExpressionAttributeValues: {
              ":quiz": quiz,
              ":now": now,
              ":nl": true,
              ...(own ? {} : { ":recent": new Date(Date.now() - QUIZ_WINDOW_MS).toISOString() }),
            },
          }),
        )
        .catch((err) => {
          // Answers already saved for an older sign-up are left as they are.
          if (!conditionFailed(err)) throw err;
        });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}
