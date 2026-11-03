import "server-only";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { DEFAULT_PREORDER } from "@/lib/preorder";
import { getAutomaticDiscount, updateAutomaticDiscount } from "@/lib/shopify/admin";
import type { BannerSettings, PreorderSettings } from "@/types/records";

export const SETTINGS_TAG = "store-settings";

const DEFAULT_BANNER: BannerSettings = {
  enabled: true,
  text: "Launch offer: 15% off",
  linkLabel: "Pre Order Now",
  linkHref: "/shop#people",
};

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await docClient.send(new GetCommand({ TableName: TABLES.Settings, Key: { key } }));
    if (!res.Item?.value) return fallback;
    return { ...fallback, ...(res.Item.value as T) };
  } catch (err) {
    // The storefront must keep working if the settings table is unreachable.
    console.error("[settings] read failed", key, (err as Error).name);
    return fallback;
  }
}

async function write(key: string, value: unknown, actor: string) {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.Settings,
      Item: { key, value, updatedAt: new Date().toISOString(), updatedBy: actor },
    }),
  );
  revalidateTag(SETTINGS_TAG);
}

/**
 * The pre-order discount itself is an automatic discount in Shopify, which is
 * what checkout charges. Its on/off state and percentage are read from there;
 * the label and shipping note shown on the site are kept here.
 */
const PREORDER_DISCOUNT_ID = () => process.env.SHOPIFY_PREORDER_DISCOUNT_ID || "gid://shopify/DiscountAutomaticNode/1656519196910";

async function readPreorder(): Promise<PreorderSettings> {
  const local = await read<PreorderSettings>("preorder", { ...DEFAULT_PREORDER });
  try {
    const d = await getAutomaticDiscount(PREORDER_DISCOUNT_ID());
    if (!d) return { ...local, active: false };
    return { ...local, active: d.status === "ACTIVE", discountPct: d.percentage };
  } catch (err) {
    // Without Shopify the site shows the last saved values; checkout still prices from Shopify.
    console.error("[settings] shopify discount read failed", (err as Error).name);
    return local;
  }
}

export const getPreorderSettings = unstable_cache(readPreorder, ["settings-preorder"], { tags: [SETTINGS_TAG], revalidate: 300 });

/** Uncached read, for the admin page. */
export function getPreorderSettingsFresh() {
  return readPreorder();
}

/** Updates the Shopify discount first (that is what customers are charged), then the site's copy. */
export async function savePreorderSettings(v: PreorderSettings, actor: string) {
  await updateAutomaticDiscount(PREORDER_DISCOUNT_ID(), { active: v.active, discountPct: v.discountPct, title: `${v.label} ${v.discountPct}% Off` });
  return write("preorder", v, actor);
}

export const getBannerSettings = unstable_cache(
  () => read<BannerSettings>("banner", DEFAULT_BANNER),
  ["settings-banner"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

export function saveBannerSettings(v: BannerSettings, actor: string) {
  return write("banner", v, actor);
}

/** A banner is shown only while enabled and inside its optional schedule. */
export function bannerIsLive(b: BannerSettings, now = new Date()) {
  if (!b.enabled || !b.text.trim()) return false;
  if (b.startsAt && new Date(b.startsAt) > now) return false;
  if (b.endsAt && new Date(b.endsAt) <= now) return false;
  return true;
}
