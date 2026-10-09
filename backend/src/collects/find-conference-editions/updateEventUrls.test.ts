import { describe, it, expect } from "vitest";
import { updateEventUrls } from "./updateEventUrls.js";

describe("updateEventUrls", () => {
  it("sets the url of a matched event when it had none", () => {
    const events = [{ name: "BreizhCamp", url: null }];
    const found = new Map([["BreizhCamp", ["https://www.breizhcamp.org/programme"]]]);

    expect(updateEventUrls(events, found)).toEqual([
      { name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" },
    ]);
  });

  it("leaves an unmatched event unchanged", () => {
    const events = [{ name: "SnowCamp", url: null }];

    expect(updateEventUrls(events, new Map())).toEqual(events);
  });

  it("does not add or remove events", () => {
    const events = [{ name: "BreizhCamp", url: null }, { name: "SnowCamp", url: null }];
    const found = new Map([["BreizhCamp", ["https://www.breizhcamp.org/programme"]]]);

    expect(updateEventUrls(events, found)).toHaveLength(2);
  });

  it("never overwrites an already known url", () => {
    const events = [{ name: "BreizhCamp", url: "https://www.breizhcamp.org/2026" }];
    const found = new Map([["BreizhCamp", ["https://www.breizhcamp.org/old-2022"]]]);

    expect(updateEventUrls(events, found)[0].url).toBe("https://www.breizhcamp.org/2026");
  });

  it("stores the other found urls as past editions", () => {
    const events = [{ name: "BreizhCamp", url: null }];
    const found = new Map([[
      "BreizhCamp",
      ["https://www.breizhcamp.org/2026", "https://www.breizhcamp.org/2025", "https://www.breizhcamp.org/2024"],
    ]]);

    const [updated] = updateEventUrls(events, found);

    expect(updated.url).toBe("https://www.breizhcamp.org/2026");
    expect(updated.pastEditionUrls).toEqual([
      "https://www.breizhcamp.org/2025",
      "https://www.breizhcamp.org/2024",
    ]);
  });

  it("merges newly found past editions with already known ones, deduplicated", () => {
    const events = [{
      name: "BreizhCamp",
      url: "https://www.breizhcamp.org/2026",
      pastEditionUrls: ["https://www.breizhcamp.org/2025"],
    }];
    const found = new Map([[
      "BreizhCamp",
      ["https://www.breizhcamp.org/2025", "https://www.breizhcamp.org/2024"],
    ]]);

    const [updated] = updateEventUrls(events, found);

    expect(updated.pastEditionUrls).toEqual([
      "https://www.breizhcamp.org/2025",
      "https://www.breizhcamp.org/2024",
    ]);
  });
});
