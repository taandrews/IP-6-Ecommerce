import { describe, expect, it } from "vitest";
import { productHref, normalizeProductHref } from "../lib/product-links";

describe("consolidated product links", () => {
  it("routes both active products to the unified shop", () => {
    expect(productHref("ip6-original-supplement")).toBe("/shop#people");
    expect(productHref("ip6-original-pet-powder")).toBe("/shop#pets");
  });
  it("normalizes saved legacy banner URLs and obsolete detail anchors", () => {
    expect(normalizeProductHref("/shop/ip6-original-supplement#product-details")).toBe("/shop#people");
    expect(normalizeProductHref("/ip6-original-pet-powder")).toBe("/shop#pets");
  });
  it("preserves unrelated destinations and external URLs", () => {
    expect(productHref("another-product")).toBe("/shop/another-product");
    expect(normalizeProductHref("/shop#pets")).toBe("/shop#pets");
    expect(normalizeProductHref("https://example.com/shop/ip6-original-supplement")).toBe("https://example.com/shop/ip6-original-supplement");
  });
});
