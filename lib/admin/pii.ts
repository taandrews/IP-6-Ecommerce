/**
 * Masking for staff who may see that a customer exists but not who they are
 * (the View only role). Pure functions, unit-tested.
 */
import type { Address } from "@/types";

export function maskEmail(email: string | undefined | null): string {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at < 1) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${local[0]}•••@${domain[0] ?? ""}•••${tld}`;
}

export function maskName(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0]}.`)
    .join(" ");
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 2 ? `•••• ${digits.slice(-2)}` : "••••";
}

/** Keeps only the region and country, enough for shipping reports. */
export function maskAddress(a: Address | undefined | null): Address | null {
  if (!a) return null;
  return { name: maskName(a.name), line1: "•••", city: "•••", region: a.region, postalCode: "•••", country: a.country };
}
