// Upload site media (assets/) to the S3 assets bucket and invalidate CloudFront.
// Source of truth for images and video is assets/ in this repo; the app resolves
// them through lib/assets.ts -> NEXT_PUBLIC_CDN_URL. Nothing under assets/ ships
// in the Next build.
//
//   npm run assets:sync
//
// Defaults target production. For staging: S3_ASSETS_BUCKET=ip6original-assets-staging CLOUDFRONT_DISTRIBUTION_ID=E2DO6DIECYYNFX npm run assets:sync
import { spawnSync } from "node:child_process";

const bucket = process.env.S3_ASSETS_BUCKET || "ip6original-assets-prod";
const distribution = process.env.CLOUDFRONT_DISTRIBUTION_ID || "E3R3O337UT91I6";
const profile = process.env.AWS_PROFILE || "ip6";

function aws(args) {
  const r = spawnSync("aws", [...args, "--profile", profile], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

aws(["s3", "sync", "assets/", `s3://${bucket}/`, "--cache-control", "public, max-age=31536000, immutable"]);
aws(["cloudfront", "create-invalidation", "--distribution-id", distribution, "--paths", "/*", "--query", "Invalidation.[Id,Status]", "--output", "text"]);
