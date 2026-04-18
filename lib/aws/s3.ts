import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "us-east-1";

export const s3Client = new S3Client({
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

const BUCKET = process.env.S3_ASSETS_BUCKET ?? "ip6original-assets";
const CDN = process.env.CLOUDFRONT_DOMAIN;

export function assetUrl(key: string) {
  if (CDN) return `https://${CDN}/${key}`;
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3Client, cmd, { expiresIn: 300 });
}
