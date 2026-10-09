import { describe, it, expect } from "vitest";
import { parseSearchResults } from "./parseSearchResults.js";

describe("parseSearchResults", () => {
  it("returns the first result's URL", () => {
    const data = { results: [{ url: "https://www.breizhcamp.org/programme" }, { url: "https://other.example" }] };
    expect(parseSearchResults(data)).toBe("https://www.breizhcamp.org/programme");
  });

  it("returns null when there are no results", () => {
    expect(parseSearchResults({ results: [] })).toBeNull();
  });

  it("returns null when the results field is absent", () => {
    expect(parseSearchResults({})).toBeNull();
  });

  it("returns null when the first result has no url", () => {
    expect(parseSearchResults({ results: [{}] })).toBeNull();
  });
});
