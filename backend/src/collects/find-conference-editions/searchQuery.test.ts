import { describe, it, expect } from "vitest";
import { buildSearchQuery } from "./searchQuery.js";

describe("buildSearchQuery", () => {
  it("includes the event name and the given year", () => {
    expect(buildSearchQuery("BreizhCamp", 2026)).toBe("BreizhCamp 2026 programme");
  });

  it("defaults to the current year when none is given", () => {
    const currentYear = new Date().getFullYear();
    expect(buildSearchQuery("BreizhCamp")).toBe(`BreizhCamp ${currentYear} programme`);
  });
});
