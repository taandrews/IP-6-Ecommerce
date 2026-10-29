import { describe, expect, it, vi, beforeEach } from "vitest";

const session = { user: null as null | { sub: string; username: string; email: string; emailVerified: boolean; groups: string[]; exp: number } };

const cognito = { active: true };
vi.mock("@/lib/auth/session", () => ({ getStaffUser: async () => session.user, getAccessToken: () => (session.user ? `at-${session.user.groups.join()}` : null) }));
vi.mock("@/lib/aws/cognito", () => ({ accessTokenActive: async () => cognito.active }));
vi.mock("next/headers", () => ({ headers: () => new Headers({ "x-forwarded-for": "203.0.113.5" }) }));
vi.mock("next/navigation", () => ({ redirect: (u: string) => { throw new Error(`redirect:${u}`); } }));

const { withAdmin, HttpError } = await import("@/lib/admin/guard");

function as(groups: string[] | null) {
  session.user = groups ? { sub: "s1", username: "s1", email: "s@ip6.test", emailVerified: true, groups, exp: 9e9 } : null;
}

describe("withAdmin", () => {
  const handler = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
  beforeEach(() => handler.mockClear());

  it("401 without a staff session", async () => {
    as(null);
    const res = await withAdmin("orders:read", handler)(new Request("http://x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("401 once Cognito has revoked the session, even though the ID token still verifies", async () => {
    as(["owner"]);
    cognito.active = false;
    const res = await withAdmin("orders:read", handler)(new Request("http://x"), { params: Promise.resolve({}) });
    cognito.active = true;
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("403 when the role lacks the permission", async () => {
    as(["viewer"]);
    const res = await withAdmin("orders:refund", handler)(new Request("http://x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    as(["staff"]);
    expect((await withAdmin("customers:delete", handler)(new Request("http://x"), { params: Promise.resolve({}) })).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("runs the handler for an allowed role and marks the response no-store", async () => {
    as(["owner"]);
    const res = await withAdmin("orders:refund", handler)(new Request("http://x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("turns errors into safe JSON without internal details", async () => {
    as(["owner"]);
    const boom = await withAdmin("orders:read", async () => {
      throw new Error("db password is hunter2");
    })(new Request("http://x"), { params: Promise.resolve({}) });
    expect(boom.status).toBe(500);
    expect(await boom.text()).not.toContain("hunter2");
    const known = await withAdmin("orders:read", async () => {
      throw new HttpError(409, "wrong_status");
    })(new Request("http://x"), { params: Promise.resolve({}) });
    expect(known.status).toBe(409);
    expect(await known.json()).toEqual({ error: "wrong_status" });
  });
});
