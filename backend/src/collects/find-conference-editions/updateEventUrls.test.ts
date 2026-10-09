import { describe, it, expect } from "vitest";
import { updateEventUrls } from "./updateEventUrls.js";

describe("updateEventUrls", () => {
  it("sets the url of a matched event", () => {
    const events = [{ name: "BreizhCamp", url: null }];
    const found = new Map([["BreizhCamp", "https://www.breizhcamp.org/programme"]]);

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
    const found = new Map([["BreizhCamp", "https://www.breizhcamp.org/programme"]]);

    expect(updateEventUrls(events, found)).toHaveLength(2);
  });
});
