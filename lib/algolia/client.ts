import { algoliasearch } from "algoliasearch";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "";
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY ?? "";
const adminKey = process.env.ALGOLIA_ADMIN_KEY ?? "";

export const ALGOLIA_PRODUCTS_INDEX =
  process.env.NEXT_PUBLIC_ALGOLIA_PRODUCTS_INDEX ?? "products";

export const searchClient = appId && searchKey ? algoliasearch(appId, searchKey) : null;

export const adminClient = appId && adminKey ? algoliasearch(appId, adminKey) : null;
