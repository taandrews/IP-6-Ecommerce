import { describe, expect, it } from "vitest";
import { gs1Date, gtinProblem, isGln, normalizeGtin, parseGs1 } from "@/lib/inventory/gs1";

const today = new Date("2026-11-06T00:00:00Z");
const GS = "\x1d";

describe("GTIN", () => {
  it("accepts a UPC-A (GS1's textbook example) and pads it to 14 digits", () => {
    expect(normalizeGtin("036000291452")).toBe("00036000291452");
    expect(normalizeGtin("00036000291452")).toBe("00036000291452");
  });

  it("refuses a wrong check digit or length", () => {
    expect(normalizeGtin("036000291453")).toBeNull();
    expect(normalizeGtin("03600029145")).toBeNull();
    expect(normalizeGtin("abc")).toBeNull();
  });
});

describe("GLN", () => {
  it("checks the 13-digit mod-10 check digit", () => {
    // GS1's published example GLN.
    expect(isGln("0614141000005")).toBe(true);
    expect(isGln("0614141000006")).toBe(false);
    expect(isGln("614141000005")).toBe(false);
  });
});

describe("GS1 dates", () => {
  it("reads YYMMDD, with day 00 meaning the month's last day", () => {
    expect(gs1Date("280630", today)).toBe("2028-06-30");
    expect(gs1Date("280200", today)).toBe("2028-02-29");
    expect(gs1Date("281301", today)).toBeNull();
    expect(gs1Date("280231", today)).toBeNull();
  });

  it("picks the century by the GS1 rule (up to 49 years ahead, 50 behind)", () => {
    expect(gs1Date("750101", today)).toBe("2075-01-01");
    expect(gs1Date("780101", today)).toBe("1978-01-01");
  });
});

describe("carton barcodes", () => {
  it("reads the bracketed text form", () => {
    expect(parseGs1("(01)00036000291452(17)280630(10)L2601", today)).toEqual({ gtin: "00036000291452", expiresOn: "2028-06-30", lot: "L2601" });
  });

  it("reads raw scanner output with a symbology prefix and group separators", () => {
    expect(parseGs1(`]d2010003600029145217280630` + `10L2601${GS}21SN99`, today)).toEqual({ gtin: "00036000291452", expiresOn: "2028-06-30", lot: "L2601", serial: "SN99" });
    expect(parseGs1(`]C1010003600029145210L2601${GS}17280630`, today)).toEqual({ gtin: "00036000291452", lot: "L2601", expiresOn: "2028-06-30" });
  });

  it("uses best before (15) when there's no expiry (17)", () => {
    expect(parseGs1("(01)00036000291452(15)271231(10)B7", today)).toEqual({ gtin: "00036000291452", expiresOn: "2027-12-31", lot: "B7" });
  });

  it("refuses non-GS1 text and a bad GTIN", () => {
    expect(parseGs1("hello", today)).toBeNull();
    expect(parseGs1("(01)00036000291453(10)A", today)).toBeNull();
  });
});

describe("GTIN entry", () => {
  it("ignores spaces and hyphens copied from labels", () => {
    expect(normalizeGtin("0 36000 29145 2")).toBe("00036000291452");
    expect(normalizeGtin("036000-291452")).toBe("00036000291452");
  });

  it("says what is wrong, including the check digit the number needs", () => {
    expect(gtinProblem("036000291452")).toBeNull();
    expect(gtinProblem("850057629307")).toBe("The last digit should be 9 for this number, not 7. Check it against the label for a typo.");
    expect(gtinProblem("12345")).toBe("A GTIN has 8, 12, 13 or 14 digits. This has 5.");
    expect(gtinProblem("03600029145A")).toBe("Use digits only.");
  });
});
