import "server-only";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { docClient, INDEXES, TABLES } from "@/lib/aws/dynamo";
import type { ReviewRecord, ReviewStatus } from "@/types/records";
import { decodeCursor, encodeCursor } from "./cursor";

export const reviewsTag = (sku: string) => `reviews:${sku}`;

export async function createReview(r: ReviewRecord) {
  await docClient.send(new PutCommand({ TableName: TABLES.Reviews, Item: r, ConditionExpression: "attribute_not_exists(reviewId)" }));
}

export async function listReviewsByStatus(status: ReviewStatus, cursor?: string, limit = 50) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.Reviews,
      IndexName: INDEXES.reviewsByStatus,
      KeyConditionExpression: "#s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status },
      ScanIndexForward: status !== "pending" ? false : true,
      Limit: Math.min(limit, 100),
      ExclusiveStartKey: decodeCursor(cursor, ["sku", "reviewId", "status", "createdAt"]),
    }),
  );
  return { reviews: (res.Items ?? []) as ReviewRecord[], cursor: encodeCursor(res.LastEvaluatedKey) };
}

export async function moderateReview(sku: string, reviewId: string, status: "published" | "rejected", actor: string, reason?: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLES.Reviews,
      Key: { sku, reviewId },
      UpdateExpression: "SET #s = :s, moderatedAt = :t, moderatedBy = :a" + (reason ? ", rejectReason = :r" : " REMOVE rejectReason"),
      ConditionExpression: "attribute_exists(reviewId)",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status, ":t": new Date().toISOString(), ":a": actor, ...(reason ? { ":r": reason } : {}) },
    }),
  );
  revalidateTag(reviewsTag(sku));
}

/** Published reviews for a product page. Only the public fields leave the server. */
export function getPublishedReviews(sku: string) {
  return unstable_cache(
    async () => {
      try {
        const res = await docClient.send(
          new QueryCommand({
            TableName: TABLES.Reviews,
            KeyConditionExpression: "sku = :k",
            FilterExpression: "#s = :p",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":k": sku, ":p": "published" },
          }),
        );
        return ((res.Items ?? []) as ReviewRecord[])
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((r) => ({
            reviewId: r.reviewId,
            sku: r.sku,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            body: r.body,
            verifiedPurchase: r.verifiedPurchase,
            createdAt: r.createdAt,
          }));
      } catch (err) {
        console.error("[reviews] read failed", (err as Error).name);
        return [];
      }
    },
    ["reviews-published", sku],
    { tags: [reviewsTag(sku)], revalidate: 600 },
  )();
}

export async function listReviewsByUser(userId: string) {
  const res = await docClient.send(
    new QueryCommand({
      TableName: TABLES.Reviews,
      IndexName: INDEXES.reviewsByUser,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    }),
  );
  return (res.Items ?? []) as ReviewRecord[];
}

/** Erasure: the review text stays (it is not personal data on its own); the author is removed. */
export async function anonymizeReviewsForUser(userId: string) {
  const reviews = await listReviewsByUser(userId);
  for (const r of reviews) {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.Reviews,
        Key: { sku: r.sku, reviewId: r.reviewId },
        UpdateExpression: "SET authorName = :n REMOVE userId",
        ExpressionAttributeValues: { ":n": "Former customer" },
      }),
    );
    revalidateTag(reviewsTag(r.sku));
  }
  return reviews.length;
}
