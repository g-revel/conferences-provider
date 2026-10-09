import { describe, it, expect } from "vitest";
import { getConferences } from "./get-conferences.js";

describe("getConferences", () => {
  it("returns a non-empty list of named conferences", async () => {
    const conferences = await getConferences();
    expect(conferences.length).toBeGreaterThan(0);
    expect(conferences.every((c) => typeof c.name === "string" && c.name.length > 0)).toBe(true);
  });

  it("includes Devoxx France", async () => {
    const conferences = await getConferences();
    expect(conferences.map((c) => c.name)).toContain("Devoxx France");
  });
});
