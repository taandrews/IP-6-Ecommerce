import Stripe from "stripe";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { products } from "../content/products";
import { mergeCatalog } from "../lib/data/merge-catalog";
import { syncCatalogToStripe } from "../lib/stripe/sync";
import type { InventoryItem, ProductOverride } from "../types/records";

/*
  Mirrors the catalog (static products + admin overrides + stock) into Stripe.
    APP_ENV=staging npm run stripe:sync                  # mirror
    APP_ENV=staging npm run stripe:sync -- --archive-others   # also archive hand-made products
  Reads the Stripe key from Secrets Manager (ip6/<env>/stripe), or STRIPE_SECRET_KEY.
  Never prints keys.
*/
async function main() {
  const env = process.env.APP_ENV === "prod" ? "prod" : "staging";
  const region = process.env.APP_AWS_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const prefix = process.env.DYNAMODB_TABLE_PREFIX ?? `ip6_${env}_`;
  const archiveOthers = process.argv.includes("--archive-others");

  let secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    const sm = new SecretsManagerClient({ region });
    const res = await sm.send(new GetSecretValueCommand({ SecretId: `ip6/${env}/stripe` }));
    secretKey = (JSON.parse(res.SecretString ?? "{}") as { secretKey?: string }).secretKey;
  }
  if (!secretKey || secretKey.includes("REPLACE_ME")) throw new Error(`No Stripe secret key for ${env}`);
  const mode = secretKey.startsWith("sk_live") ? "LIVE" : "test";
  if (mode === "LIVE" && !process.argv.includes("--live")) throw new Error("Refusing to touch the live account without --live");

  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
  const scan = async <T>(table: string) => {
    const out: T[] = [];
    let start: Record<string, unknown> | undefined;
    do {
      const res = await ddb.send(new ScanCommand({ TableName: table, ExclusiveStartKey: start }));
      out.push(...((res.Items ?? []) as T[]));
      start = res.LastEvaluatedKey;
    } while (start);
    return out;
  };
  const [overrides, stock] = await Promise.all([scan<ProductOverride>(`${prefix}Products`), scan<InventoryItem>(`${prefix}Inventory`)]);
  const catalog = mergeCatalog(products, overrides, stock);

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20", typescript: true });
  console.log(`Syncing ${catalog.length} products to Stripe (${mode} mode, ${env} tables)${archiveOthers ? ", archiving hand-made products" : ""}`);
  const s = await syncCatalogToStripe(stripe, catalog, { archiveOthers });
  console.log(`Products: ${s.products} · prices created: ${s.pricesCreated} · unchanged: ${s.pricesKept} · archived: ${s.pricesArchived} · other products archived: ${s.productsArchived}`);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
