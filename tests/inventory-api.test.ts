import { beforeEach, describe, expect, it, vi } from "vitest";

const session = { user: { sub: "s1", username: "s1", email: "staff@ip6original.com", emailVerified: true, groups: ["owner"], exp: 9e9 } as null | Record<string, unknown> };
vi.mock("@/lib/auth/session", () => ({ getStaffUser: async () => session.user, getAccessToken: () => (session.user ? "at" : null) }));
vi.mock("@/lib/aws/cognito", () => ({ accessTokenActive: async () => true }));
vi.mock("next/headers", () => ({ headers: () => new Headers({ "x-forwarded-for": "203.0.113.5" }) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => { throw new Error(`redirect:${u}`); } }));

const audit = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/lib/data/audit", () => ({ audit }));
vi.mock("@/lib/data/catalog", () => ({ refreshCatalog: () => undefined }));
vi.mock("@/lib/inventory/alerts", () => ({ checkLowStock: async () => undefined }));

const store = vi.hoisted(() => ({
  createLocation: vi.fn(async () => "loc_a1b2c3d4e5f6"),
  updateLocation: vi.fn(async () => undefined),
  receive: vi.fn(async () => undefined),
  setItemGtin: vi.fn(async () => undefined),
}));
vi.mock("@/lib/inventory/store", async (orig) => ({ ...(await orig<object>()), ...store }));

const { POST } = await import("@/app/api/admin/inventory/route");

const call = (body: unknown) =>
  POST(new Request("https://admin.test/api/admin/inventory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({}) });

const location = {
  action: "location",
  code: "md1",
  name: "Maryland warehouse",
  type: "warehouse",
  address: { line1: "1 Main St", city: "Lutherville", region: "MD", postalCode: "21093", country: "US" },
  operator: { company: "IP6 Original", phone: "(202) 555-0143" },
  contact: { name: "Sam Lee", role: "Operations", email: "Ops@Example.com", phone: "+44 20 7946 0958" },
  countries: ["US"],
  priority: 1,
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  session.user = { sub: "s1", username: "s1", email: "staff@ip6original.com", emailVerified: true, groups: ["owner"], exp: 9e9 };
});

describe("inventory API: locations", () => {
  it("stores phones in E.164, the code in capitals and the email in lower case", async () => {
    const res = await call(location);
    expect(res.status).toBe(200);
    expect(store.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "MD1",
        operator: { company: "IP6 Original", phone: "+12025550143" },
        contact: expect.objectContaining({ email: "ops@example.com", phone: "+442079460958" }),
      }),
    );
  });

  it("reads a number without + in the location's country, so another country's local number is refused", async () => {
    const res = await call({ ...location, contact: { ...location.contact, phone: "020 7946 0958" } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_phone" });
    expect(store.createLocation).not.toHaveBeenCalled();
  });

  it("refuses an invalid phone, email or GLN", async () => {
    expect((await call({ ...location, operator: { company: "X Co", phone: "12" } })).status).toBe(400);
    expect((await call({ ...location, contact: { ...location.contact, email: "not-an-email" } })).status).toBe(400);
    expect((await call({ ...location, gln: "0614141000006" })).status).toBe(400);
    expect(store.createLocation).not.toHaveBeenCalled();
  });

  it("never writes contact details to the activity log", async () => {
    await call({ ...location, contact: { ...location.contact, phone: "+44 20 7946 0958" } });
    const meta = JSON.stringify(audit.mock.calls);
    expect(meta).not.toContain("example.com");
    expect(meta).not.toContain("7946");
    expect(meta).not.toContain("Sam Lee");
  });

  it("needs inventory:write", async () => {
    session.user = { ...session.user!, groups: ["support"] };
    const res = await call(location);
    expect([401, 403]).toContain(res.status);
    expect(store.createLocation).not.toHaveBeenCalled();
  });
});

describe("inventory API: scanned receipts", () => {
  const receipt = { action: "receive", sku: "SUP-IP6-CAP240", locationId: "loc_a1b2c3d4e5f6", lotNo: "L2601", expiresOn: "2028-06-30", qty: 24 };

  it("reads the barcode on the server and passes its GTIN for the product check", async () => {
    const res = await call({ ...receipt, scan: "(01)00036000291452(17)280630(10)L2601" });
    expect(res.status).toBe(200);
    expect(store.receive).toHaveBeenCalledWith(expect.objectContaining({ scannedGtin: "00036000291452", lotNo: "L2601", expiresOn: "2028-06-30" }));
  });

  it("refuses a form whose lot or expiry differs from the scanned carton", async () => {
    expect((await call({ ...receipt, lotNo: "OTHER", scan: "(01)00036000291452(17)280630(10)L2601" })).status).toBe(400);
    expect((await call({ ...receipt, expiresOn: "2029-01-01", scan: "(01)00036000291452(17)280630(10)L2601" })).status).toBe(400);
    expect((await call({ ...receipt, scan: "not a barcode" })).status).toBe(400);
    expect(store.receive).not.toHaveBeenCalled();
  });
});
