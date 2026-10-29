import { NextResponse } from "next/server";
import { z } from "zod";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { emailKey } from "@/lib/data/orders";
import { newsletterKey } from "@/lib/data/customers";
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
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please tick the box to agree to emails." }, { status: 400 });
  const { email, source, quiz } = parsed.data;
  try {
    const now = new Date().toISOString();
    // The pop-up saves the email first, then again with the answers once the quiz ends,
    // so this updates the row rather than replacing it and keeps the first sign-up date.
    const names: Record<string, string> = { "#email": "email", "#nl": "newsletter", "#ca": "consentedAt", "#cv": "consentVersion", "#src": "source", "#cr": "createdAt", "#up": "updatedAt" };
    const values: Record<string, unknown> = {
      ":email": emailKey(email),
      ":nl": true,
      ":ca": now,
      ":cv": source === "prebook_popup" ? QUIZ_CONSENT_VERSION : CONSENT_VERSION,
      ":src": source,
      ":now": now,
    };
    let update = "SET #email = :email, #nl = :nl, #ca = :ca, #cv = :cv, #src = :src, #cr = if_not_exists(#cr, :now), #up = :now";
    if (quiz && Object.keys(quiz).length) {
      names["#quiz"] = "quiz";
      names["#qa"] = "quizAt";
      values[":quiz"] = quiz;
      update += ", #quiz = :quiz, #qa = :now";
    }
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Users,
        Key: { userId: newsletterKey(email) },
        UpdateExpression: update,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] save failed", (err as Error).name);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }
}
