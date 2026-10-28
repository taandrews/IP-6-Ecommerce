/** The active products share one shopping page, with stable anchors for inbound links. */
export function productHref(slug: string): string {
  if (slug === "ip6-original-supplement") return "/shop#people";
  if (slug === "ip6-original-pet-powder") return "/shop#pets";
  return `/shop/${slug}`;
}

export function normalizeProductHref(href: string): string {
  const match = href.match(/^\/(?:shop\/)?(ip6-original-supplement|ip6-original-pet-powder)(?:[?#].*)?$/);
  return match?.[1] ? productHref(match[1]) : href;
}
