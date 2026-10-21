import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/admin/csv";
import { maskAddress, maskEmail, maskName, maskPhone } from "@/lib/admin/pii";
import { sealEmail, unsealEmail } from "@/lib/admin/seal";
import { decodeCursor, encodeCursor } from "@/lib/data/cursor";
import { parseConsent, serializeConsent } from "@/lib/consent";
import { safeTrackingUrl } from "@/lib/orders/admin";

describe("CSV export", () => {
  it("neutralizes spreadsheet formulas (CSV injection)", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvCell("+1 555")).toBe(`"'+1 555"`);
    expect(csvCell("-2")).toBe(`"'-2"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(csvCell("Jane O\"Neil")).toBe(`"Jane O""Neil"`);
    expect(toCsv(["a", "b"], [[1, null]])).toBe(`"a","b"\r\n"1",""\r\n`);
  });
});

describe("PII masking for view-only staff", () => {
  it("masks email, name, phone and address", () => {
    expect(maskEmail("jane.doe@gmail.com")).toBe("j•••@g•••.com");
    expect(maskName("Jane Doe")).toBe("J. D.");
    expect(maskPhone("+1 (410) 555-0199")).toBe("•••• 99");
    const a = maskAddress({ name: "Jane Doe", line1: "1 Main St", city: "Towson", region: "MD", postalCode: "21204", country: "US" });
    expect(a).toEqual({ name: "J. D.", line1: "•••", city: "•••", region: "MD", postalCode: "•••", country: "US" });
  });
});

describe("sealed customer links", () => {
  it("round-trips and rejects tampering", () => {
    const t = sealEmail("Jane@Example.com");
    expect(t).not.toContain("example");
    expect(unsealEmail(t)).toBe("jane@example.com");
    const flipped = t.slice(0, -2) + (t.endsWith("A") ? "B" : "A") + t.slice(-1);
    expect(unsealEmail(flipped)).toBeNull();
    expect(unsealEmail("garbage")).toBeNull();
    expect(unsealEmail(undefined)).toBeNull();
  });
});

describe("pagination cursors", () => {
  it("only decodes the expected key attributes", () => {
    const c = encodeCursor({ orderId: "IP6-ABC", status: "paid", createdAt: "2026-10-20" });
    expect(decodeCursor(c, ["orderId", "status", "createdAt"])).toEqual({ orderId: "IP6-ABC", status: "paid", createdAt: "2026-10-20" });
    expect(decodeCursor(c, ["orderId"])).toBeUndefined();
    expect(decodeCursor(encodeCursor({ orderId: { S: "x" } }), ["orderId"])).toBeUndefined();
    expect(decodeCursor("!!!", ["orderId"])).toBeUndefined();
  });
});

describe("cookie consent", () => {
  it("parses and serializes choices", () => {
    expect(parseConsent("all")).toEqual({ analytics: true, marketing: true });
    expect(parseConsent("essential")).toEqual({ analytics: false, marketing: false });
    expect(parseConsent("custom:1:0")).toEqual({ analytics: true, marketing: false });
    expect(parseConsent("custom:0:1")).toEqual({ analytics: false, marketing: true });
    expect(parseConsent("junk")).toBeNull();
    expect(serializeConsent({ analytics: true, marketing: false })).toBe("custom:1:0");
  });
});

describe("tracking links", () => {
  it("only stores http(s) URLs", () => {
    expect(safeTrackingUrl("https://tools.usps.com/go/TrackConfirmAction?tLabels=1")).toContain("https://tools.usps.com");
    expect(safeTrackingUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeTrackingUrl("not a url")).toBeUndefined();
  });
});
