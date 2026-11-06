import { describe, expect, it } from "vitest";
import { formatPhone, toE164 } from "@/lib/phone";

describe("phone numbers", () => {
  it("stores numbers in E.164, reading local numbers in the location's country", () => {
    expect(toE164("(202) 555-0143", "US")).toBe("+12025550143");
    expect(toE164("020 7946 0958", "GB")).toBe("+442079460958");
    expect(toE164("+44 20 7946 0958", "US")).toBe("+442079460958");
  });

  it("refuses something that isn't a phone number", () => {
    expect(toE164("12", "US")).toBeNull();
    expect(toE164("call me", "US")).toBeNull();
  });

  it("shows numbers in international format", () => {
    expect(formatPhone("+442079460958")).toBe("+44 20 7946 0958");
  });
});
