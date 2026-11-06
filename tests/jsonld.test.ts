import { describe, expect, it } from "vitest";
import { jsonLd } from "@/lib/utils";

describe("jsonLd", () => {
  it("can't close the script tag it sits in, and still parses to the same value", () => {
    const value = { name: "</script><script>alert(1)</script>" };
    const out = jsonLd(value);
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual(value);
  });
});
