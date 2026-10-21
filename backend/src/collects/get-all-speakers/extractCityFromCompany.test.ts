import { describe, it, expect } from "vitest";
import { extractCityFromCompany } from "./extractCityFromCompany.js";

describe("extractCityFromCompany", () => {
  it("extracts the city suffix from a Shodo company", () => {
    expect(extractCityFromCompany("Shodo Rennes")).toBe("Rennes");
  });

  it("returns null for a company that isn't Shodo", () => {
    expect(extractCityFromCompany("Acme")).toBeNull();
  });

  it("returns null for Shodo alone, without a suffix", () => {
    expect(extractCityFromCompany("Shodo")).toBeNull();
  });

  it("returns null for a known non-city suffix", () => {
    expect(extractCityFromCompany("Shodo Studio")).toBeNull();
  });

  it("keeps a multi-word suffix as-is", () => {
    expect(extractCityFromCompany("Shodo La Reunion")).toBe("La Reunion");
  });
});
