import { describe, expect, it } from "vitest";
import { addressBlock, countryInSentence, countryOptions, isSellableCountry, SELLABLE_COUNTRIES } from "@/lib/countries";

const us = { country: "US", region: "MD", city: "Towson", postalCode: "21204" };

describe("sales gate: where we sell", () => {
  it("sells to the US only, by one setting", () => {
    expect(SELLABLE_COUNTRIES).toEqual(["US"]);
    expect(isSellableCountry("us")).toBe(true);
    for (const c of ["CA", "GB", "PR", "GU", "VI", "AS", "MP", "", undefined]) expect(isSellableCountry(c)).toBe(false);
  });

  it("accepts the 50 states and DC", () => {
    expect(addressBlock(us)).toBeNull();
    expect(addressBlock({ ...us, region: "DC", city: "Washington", postalCode: "20001" })).toBeNull();
    expect(addressBlock({ ...us, region: "HI", city: "Honolulu", postalCode: "96813" })).toBeNull();
    expect(addressBlock({ ...us, region: "AK", city: "Anchorage", postalCode: "99501" })).toBeNull();
  });

  it("blocks other countries, whatever the address says", () => {
    expect(addressBlock({ country: "GB", region: "", city: "London", postalCode: "SW1A 1AA" })).toBe("country");
    expect(addressBlock({ country: "PR", region: "", city: "San Juan", postalCode: "00901" })).toBe("country");
  });

  it("blocks US territories typed as US addresses, by state, name or ZIP", () => {
    expect(addressBlock({ ...us, region: "PR", city: "San Juan", postalCode: "00901" })).toBe("territory");
    expect(addressBlock({ ...us, region: "Puerto Rico", city: "San Juan", postalCode: "" })).toBe("territory");
    expect(addressBlock({ ...us, region: "", city: "Hagatna", postalCode: "96910" })).toBe("territory");
    expect(addressBlock({ ...us, region: "", city: "Pago Pago", postalCode: "96799" })).toBe("territory");
    expect(addressBlock({ ...us, region: "VI", city: "Charlotte Amalie", postalCode: "00802" })).toBe("territory");
  });

  it("blocks APO, FPO and DPO military addresses", () => {
    expect(addressBlock({ ...us, region: "AE", city: "APO", postalCode: "09012" })).toBe("military");
    expect(addressBlock({ ...us, region: "AP", city: "FPO", postalCode: "96349" })).toBe("military");
    expect(addressBlock({ ...us, region: "AA", city: "DPO", postalCode: "34001" })).toBe("military");
    expect(addressBlock({ ...us, region: "MD", city: "apo", postalCode: "21204" })).toBe("military");
  });

  it("reads country names correctly in a sentence", () => {
    expect(countryInSentence("GB")).toBe("the United Kingdom");
    expect(countryInSentence("NL")).toBe("the Netherlands");
    expect(countryInSentence("KY")).toBe("the Cayman Islands");
    expect(countryInSentence("AE")).toBe("the United Arab Emirates");
    expect(countryInSentence("IM")).toBe("the Isle of Man");
    expect(countryInSentence("FR")).toBe("France");
    expect(countryInSentence("DE")).toBe("Germany");
    expect(countryInSentence("CA")).toBe("Canada");
  });

  it("lists every country for the pickers, sellable ones first", () => {
    const opts = countryOptions();
    expect(opts[0]).toEqual(["US", "United States"]);
    expect(opts.length).toBeGreaterThan(240);
    expect(opts.find(([c]) => c === "GB")?.[1]).toBe("United Kingdom");
  });
});
