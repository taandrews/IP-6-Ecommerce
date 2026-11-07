/**
 * GS1 identifiers, the global standard retailers, 3PLs and marketplaces use:
 *
 * - GTIN (Global Trade Item Number): the product's barcode number. A UPC-A
 *   (12 digits) or EAN-13 is a GTIN; GS1 logistics labels carry it as 14 digits.
 * - GLN (Global Location Number, 13 digits): identifies a site such as a
 *   warehouse, and stays the same when the site's details change.
 * - GS1-128 / GS1 DataMatrix cartons carry Application Identifiers:
 *   (01) GTIN, (10) lot, (17) expiry YYMMDD, (11) production date, (15) best before, (21) serial.
 *
 * Pure functions, no I/O.
 */

/** GS1 mod-10 check digit over all digits but the last. */
function checkDigitOk(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    // Weights alternate 3,1 starting from the digit next to the check digit.
    const d = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1));
}

/** Spaces and hyphens people copy from labels and spreadsheets are ignored. */
const stripGtin = (raw: string) => raw.replace(/[\s-]/g, "");

/** Normalises a GTIN-8/12/13/14 to 14 digits, or null if it isn't one. */
export function normalizeGtin(raw: string): string | null {
  const s = stripGtin(raw);
  if (![8, 12, 13, 14].includes(s.length) || !checkDigitOk(s)) return null;
  return s.padStart(14, "0");
}

/** Why a GTIN is refused, in words staff can act on; null when it's valid. */
export function gtinProblem(raw: string): string | null {
  const s = stripGtin(raw);
  if (!/^\d+$/.test(s)) return "Use digits only.";
  if (![8, 12, 13, 14].includes(s.length)) return `A GTIN has 8, 12, 13 or 14 digits. This has ${s.length}.`;
  if (checkDigitOk(s)) return null;
  const expected = [...Array(10).keys()].find((d) => checkDigitOk(s.slice(0, -1) + d));
  return `The last digit should be ${expected} for this number, not ${s.at(-1)}. Check it against the label for a typo.`;
}

/** True for a valid 13-digit GLN. */
export function isGln(raw: string): boolean {
  return /^\d{13}$/.test(raw) && checkDigitOk(raw);
}

/** Fixed lengths of the AIs we read; anything else ends at a separator. */
const FIXED: Record<string, number> = { "00": 18, "01": 14, "02": 14, "11": 6, "12": 6, "13": 6, "15": 6, "16": 6, "17": 6 };
const VARIABLE = new Set(["10", "21", "22", "30", "37", "240", "241"]);

/**
 * GS1 date YYMMDD to YYYY-MM-DD. The century follows the GS1 General
 * Specifications (7.12): within 49 years ahead or 50 behind today. A day of
 * 00 means the last day of the month.
 */
export function gs1Date(yymmdd: string, today = new Date()): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  let dd = Number(yymmdd.slice(4, 6));
  if (mm < 1 || mm > 12) return null;
  const cur = today.getUTCFullYear();
  const diff = yy - (cur % 100);
  let year = cur - (cur % 100) + yy;
  if (diff >= 51) year -= 100;
  else if (diff <= -50) year += 100;
  const last = new Date(Date.UTC(year, mm, 0)).getUTCDate();
  if (dd === 0) dd = last;
  if (dd > last) return null;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export interface Gs1Scan {
  gtin?: string;
  lot?: string;
  /** YYYY-MM-DD from (17), or (15) best before when there's no (17). */
  expiresOn?: string;
  serial?: string;
}

const GS = "\x1d";

/**
 * Reads a scanned GS1 barcode: the bracketed text form "(01)...(10)...(17)..."
 * or the raw scanner output with FNC1 group separators (and an optional
 * ]C1 / ]d2 / ]Q3 symbology prefix). Returns null if it isn't GS1 data.
 */
export function parseGs1(input: string, today = new Date()): Gs1Scan | null {
  const ai: Record<string, string> = {};
  const text = input.trim();
  if (text.startsWith("(")) {
    const re = /\((\d{2,4})\)([^(]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) ai[m[1]!] = m[2]!.trim();
  } else {
    let s = text.replace(/^\][A-Za-z]\d/, "");
    while (s.length) {
      if (s.startsWith(GS)) {
        s = s.slice(1);
        continue;
      }
      const code = [s.slice(0, 2), s.slice(0, 3)].find((c) => c in FIXED || VARIABLE.has(c));
      if (!code) return null;
      s = s.slice(code.length);
      if (code in FIXED) {
        ai[code] = s.slice(0, FIXED[code]);
        s = s.slice(FIXED[code]);
      } else {
        const end = s.indexOf(GS);
        ai[code] = end === -1 ? s : s.slice(0, end);
        s = end === -1 ? "" : s.slice(end + 1);
      }
    }
  }
  if (!Object.keys(ai).length) return null;
  const out: Gs1Scan = {};
  if (ai["01"]) {
    const g = normalizeGtin(ai["01"]);
    if (!g) return null;
    out.gtin = g;
  }
  if (ai["10"]) out.lot = ai["10"];
  const exp = ai["17"] ?? ai["15"];
  if (exp) {
    const d = gs1Date(exp, today);
    if (!d) return null;
    out.expiresOn = d;
  }
  if (ai["21"]) out.serial = ai["21"];
  return out;
}
