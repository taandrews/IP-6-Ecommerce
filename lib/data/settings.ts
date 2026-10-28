import "server-only";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { docClient, TABLES } from "@/lib/aws/dynamo";
import { DEFAULT_PREORDER } from "@/lib/preorder";
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

export const getPreorderSettings = unstable_cache(
  () => read<PreorderSettings>("preorder", { ...DEFAULT_PREORDER }),
  ["settings-preorder"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

/** Uncached read, for checkout pricing where a stale discount is not acceptable. */
export function getPreorderSettingsFresh() {
  return read<PreorderSettings>("preorder", { ...DEFAULT_PREORDER });
}

export function savePreorderSettings(v: PreorderSettings, actor: string) {
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
