/** The store's inboxes. Shown on the site and used as recipients and reply-to addresses. */
export const EMAIL = {
  /** Customer support and order questions from the contact form. */
  support: "support@ip6original.com",
  /** General inbox and the "Other" contact topic. */
  hello: "hello@ip6original.com",
  /** Sends order confirmations and shipping notices. */
  orders: "orders@ip6original.com",
  /** Privacy policy and data requests. */
  privacy: "privacy@ip6original.com",
  /** Wholesale inquiries. */
  wholesale: "wholesale@ip6original.com",
  /** Press inquiries. */
  press: "press@ip6original.com",
} as const;

export const CONTACT_TOPICS = ["support", "order", "wholesale", "press", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

/** Which inbox each contact form topic is delivered to. */
export const CONTACT_INBOX: Record<ContactTopic, string> = {
  support: EMAIL.support,
  order: EMAIL.support,
  wholesale: EMAIL.wholesale,
  press: EMAIL.press,
  other: EMAIL.hello,
};
