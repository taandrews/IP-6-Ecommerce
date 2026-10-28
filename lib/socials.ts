/** The store's social accounts, shown in the footer and on the contact page. */
export const SOCIALS = [
  { id: "facebook", label: "Facebook", handle: "IP6 Original", href: "https://www.facebook.com/ip6original" },
  { id: "instagram", label: "Instagram", handle: "@ip6original", href: "https://www.instagram.com/ip6original/" },
  { id: "youtube", label: "YouTube", handle: "@ip6original", href: "https://www.youtube.com/@ip6original" },
] as const;

export type SocialId = (typeof SOCIALS)[number]["id"];
