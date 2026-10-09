import { describe, it, expect } from "vitest";
import { pickBestVideoMatch } from "./pickBestVideoMatch.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const pierrain = { firstname: "Thomas", lastname: "Pierrain", company: "Shodo" };

describe("pickBestVideoMatch", () => {
  it("returns the url of the first result whose title mentions a speaker's lastname", () => {
    const results = [
      { url: "https://youtube.com/watch?v=unrelated", title: "Some unrelated talk" },
      { url: "https://youtube.com/watch?v=match", title: "Julien Topçu - OAuth 2.1 expliqué simplement" },
    ];

    expect(pickBestVideoMatch(results, [topcu])).toBe("https://youtube.com/watch?v=match");
  });

  it("matches accents and case insensitively", () => {
    const results = [{ url: "https://youtube.com/watch?v=x", title: "JULIEN TOPCU: talk title" }];

    expect(pickBestVideoMatch(results, [topcu])).toBe("https://youtube.com/watch?v=x");
  });

  it("matches on any co-presenter, not just the first speaker", () => {
    const results = [{ url: "https://youtube.com/watch?v=x", title: "The Hive pattern (Thomas Pierrain)" }];

    expect(pickBestVideoMatch(results, [topcu, pierrain])).toBe("https://youtube.com/watch?v=x");
  });

  it("does not match a lastname appearing only as a substring of another word", () => {
    const results = [{ url: "https://youtube.com/watch?v=x", title: "Topcupier's unrelated video" }];

    expect(pickBestVideoMatch(results, [topcu])).toBeNull();
  });

  it("does not match when only the lastname is present, as a different person's firstname", () => {
    const guillaumeYan = { firstname: "Guillaume", lastname: "Yan", company: "Shodo" };
    const results = [
      { url: "https://youtube.com/watch?v=x", title: "Cybersécurité pour les PME | Yan Rolland – XEFI" },
    ];

    expect(pickBestVideoMatch(results, [guillaumeYan])).toBeNull();
  });

  it("returns null when no result mentions a known speaker", () => {
    const results = [{ url: "https://youtube.com/watch?v=x", title: "Completely unrelated video" }];

    expect(pickBestVideoMatch(results, [topcu])).toBeNull();
  });

  it("returns null when there are no results", () => {
    expect(pickBestVideoMatch([], [topcu])).toBeNull();
  });
});
