import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

/**
 * A phone number in E.164 (+ country code and number, no spaces), the
 * international standard carriers and partners can dial from anywhere.
 * Numbers written without a + are read in `country`. Null if it isn't a
 * valid number.
 */
export function toE164(raw: string, country?: string): string | null {
  const p = parsePhoneNumberFromString(raw.trim(), country as CountryCode | undefined);
  return p && p.isValid() ? p.number : null;
}

/** For display: the number as written internationally, e.g. "+1 410 555 0100". */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
