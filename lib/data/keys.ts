/** Normalised email used as a lookup key in the site's own tables. */
export function emailKey(email: string) {
  return email.trim().toLowerCase();
}

export function newsletterKey(email: string) {
  return `newsletter_${emailKey(email)}`;
}
