export type ComparisonMark = "yes" | "no" | "partial";

export interface ComparisonRow {
  label: string;
  commodity: { mark: ComparisonMark; text: string };
  original: { mark: ComparisonMark; text: string };
}

/**
 * Specification comparison used on the home page and /the-difference.
 * Commodity column describes the category in general terms only; no
 * competitor is named and no figure is asserted that is not on our label.
 */
export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Formulated by",
    commodity: { mark: "no", text: "No named formulator" },
    original: { mark: "yes", text: "Prof. Shamsuddin, founder and formulator" },
  },
  {
    label: "Connection to the research",
    commodity: { mark: "no", text: "None" },
    original: { mark: "yes", text: "Built on the founder's published work" },
  },
  {
    label: "Purity",
    commodity: { mark: "partial", text: "Varies by vendor" },
    original: { mark: "yes", text: "High-Purity Formula" },
  },
  {
    label: "Verification",
    commodity: { mark: "partial", text: "Vendor declaration" },
    original: { mark: "yes", text: "Third-party tested, batch report published" },
  },
  {
    label: "Manufacturing",
    commodity: { mark: "partial", text: "Varies" },
    original: { mark: "yes", text: "cGMP-certified facility" },
  },
  {
    label: "Processing additives",
    commodity: { mark: "partial", text: "Common" },
    original: { mark: "yes", text: "No magnesium stearate or silicon dioxide" },
  },
  {
    label: "IP6 paired with Inositol",
    commodity: { mark: "partial", text: "Varies" },
    original: { mark: "yes", text: "804 mg IP6 + 196 mg Inositol per serving" },
  },
];
