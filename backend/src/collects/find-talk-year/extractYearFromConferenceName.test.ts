import { describe, it, expect } from "vitest";
import { extractYearFromConferenceName } from "./extractYearFromConferenceName.js";

describe("extractYearFromConferenceName", () => {
  it("extracts a 4-digit year from the conference name", () => {
    expect(extractYearFromConferenceName("NewCrafts 2025")).toBe(2025);
  });

  it("returns null when the name has no year", () => {
    expect(extractYearFromConferenceName("BreizhCamp")).toBeNull();
  });

  it("ignores a number that isn't a plausible year", () => {
    expect(extractYearFromConferenceName("Devoxx France 42")).toBeNull();
  });
});
