import { awsRegion } from "./region";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

/**
 * Fetches JSON-encoded secrets from AWS Secrets Manager with in-process
 * caching. In local development (when AWS creds aren't configured or the
 * secret ARN isn't set) it falls back to environment variables so dev
 * works without an AWS round-trip.
 *
 * Secrets are structured per service:
 *   ip6/{env}/stripe   → { secretKey, publishableKey, webhookSecret }
 *   ip6/{env}/sanity   → { projectId, dataset, apiToken }
 *   ip6/{env}/algolia  → { appId, searchKey, adminKey }
 *   ip6/{env}/app      → { rateLimitSecret, adminLinkKey }
 */

const region = awsRegion();
const client = new SecretsManagerClient({
  region,
});

const cache = new Map<string, { value: Record<string, string>; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchSecret(secretId: string): Promise<Record<string, string>> {
  const hit = cache.get(secretId);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.value;

  const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!res.SecretString) throw new Error(`Secret ${secretId} has no SecretString`);
  const parsed = JSON.parse(res.SecretString) as Record<string, string>;
  cache.set(secretId, { value: parsed, fetchedAt: Date.now() });
  return parsed;
}

/** APP_ENV picks the secret set explicitly ("prod" or "staging"); production builds default to prod. */
function secretName(service: "stripe" | "sanity" | "algolia" | "app") {
  const explicit = process.env.APP_ENV;
  const env =
    explicit === "prod" || explicit === "staging"
      ? explicit
      : process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL?.includes("staging")
        ? "prod"
        : "staging";
  return `ip6/${env}/${service}`;
}

export interface StripeSecrets {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
}

export async function getStripeSecrets(): Promise<StripeSecrets> {
  // Dev fallback: if env vars are set, use them and skip the Secrets Manager call.
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    };
  }
  const s = await fetchSecret(secretName("stripe"));
  return s as unknown as StripeSecrets;
}

export interface SanitySecrets {
  projectId: string;
  dataset: string;
  apiToken: string;
}

export async function getSanitySecrets(): Promise<SanitySecrets> {
  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.SANITY_API_TOKEN) {
    return {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
      apiToken: process.env.SANITY_API_TOKEN,
    };
  }
  const s = await fetchSecret(secretName("sanity"));
  return s as unknown as SanitySecrets;
}

export interface AlgoliaSecrets {
  appId: string;
  searchKey: string;
  adminKey: string;
}

export async function getAlgoliaSecrets(): Promise<AlgoliaSecrets> {
  if (process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_KEY) {
    return {
      appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      searchKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY ?? "",
      adminKey: process.env.ALGOLIA_ADMIN_KEY,
    };
  }
  const s = await fetchSecret(secretName("algolia"));
  return s as unknown as AlgoliaSecrets;
}

/**
 * The key that seals customer emails in admin links. Production always reads
 * it from Secrets Manager; ADMIN_LINK_KEY is only for local testing. Returns
 * null in development when neither is set (a per-process key is used then).
 */
export async function getAdminLinkKey(): Promise<string | null> {
  if (process.env.NODE_ENV !== "production") {
    if (process.env.ADMIN_LINK_KEY) return process.env.ADMIN_LINK_KEY;
    if (!process.env.APP_ENV) return null;
  }
  const s = await fetchSecret(secretName("app"));
  if (!s.adminLinkKey) throw new Error("adminLinkKey missing from ip6/*/app secret");
  return s.adminLinkKey;
}

export async function getRateLimitSecret(): Promise<string> {
  if (process.env.RATE_LIMIT_SECRET && process.env.RATE_LIMIT_SECRET !== "change-me-in-production") {
    return process.env.RATE_LIMIT_SECRET;
  }
  const s = await fetchSecret(secretName("app"));
  const value = s.rateLimitSecret;
  if (!value) throw new Error("rateLimitSecret missing from ip6/*/app secret");
  return value;
}
