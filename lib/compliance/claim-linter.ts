/**
 * Compliance claim linter — enforces the regulatory firewall between
 * ip6original.com and ip-6.net, and blocks disease-treatment language on
 * supplement + skincare content.
 *
 * Runs via `scripts/compliance-check.ts` at build time and in any API
 * route that accepts user-generated content (reviews, contact form).
 */

const BANNED_WORDS = [
  "treats",
  "treat",
  "cures",
  "cure",
  "prevents",
  "prevent",
  "heals",
  "heal",
  "remedy",
  "remedies",
];

const FORBIDDEN_REFERENCES = [
  "ip-6.net",
  "ip6.net",
  "www.ip-6.net",
  "https://ip-6.net",
  "http://ip-6.net",
];

const MEDICAL_CONTEXT_WORDS = [
  "cancer",
  "tumor",
  "disease",
  "diabetes",
  "alzheimer",
  "dementia",
  "heart disease",
  "cardiovascular disease",
  "arthritis",
  "osteoporosis",
  "parkinson",
  "covid",
  "infection",
  "virus",
];

export interface ComplianceFinding {
  severity: "error" | "warning";
  rule: string;
  match: string;
  context: string;
  suggestion?: string;
}

export function lintContent(
  text: string,
  context: "supplement" | "skincare" | "filter" | "general" = "general",
): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];
  const normalized = text.toLowerCase();

  for (const ref of FORBIDDEN_REFERENCES) {
    if (normalized.includes(ref)) {
      findings.push({
        severity: "error",
        rule: "FORBIDDEN_SITE_REFERENCE",
        match: ref,
        context: excerpt(text, ref),
        suggestion: "Remove all references to ip-6.net. The research site is legally separated.",
      });
    }
  }

  if (context === "supplement" || context === "skincare") {
    for (const word of BANNED_WORDS) {
      const re = new RegExp(`\\b${word}\\b`, "i");
      if (re.test(text)) {
        const nearMedical = MEDICAL_CONTEXT_WORDS.some((m) =>
          isNear(normalized, word.toLowerCase(), m, 80),
        );
        if (nearMedical) {
          findings.push({
            severity: "error",
            rule: "DISEASE_CLAIM",
            match: word,
            context: excerpt(text, word),
            suggestion:
              "Replace with structure-function wording (e.g., 'supports healthy X', 'formulated for X').",
          });
        } else {
          findings.push({
            severity: "warning",
            rule: "BANNED_VERB",
            match: word,
            context: excerpt(text, word),
            suggestion: "Review phrasing — avoid disease-claim verbs on supplement/skincare pages.",
          });
        }
      }
    }
  }

  return findings;
}

function excerpt(text: string, needle: string, pad = 40) {
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return "";
  const start = Math.max(0, idx - pad);
  const end = Math.min(text.length, idx + needle.length + pad);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

function isNear(text: string, a: string, b: string, maxDistance: number) {
  const ia = text.indexOf(a);
  const ib = text.indexOf(b);
  if (ia < 0 || ib < 0) return false;
  return Math.abs(ia - ib) <= maxDistance;
}

export const DSHEA_DISCLAIMER =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";
