import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findTalkVideo } from "./findTalkVideo.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("findTalkVideo", () => {
  it("returns null without searching when the talk has no title", async () => {
    const speak = { conference: { name: "MixIT" }, speakers: [topcu], title: null };

    await expect(findTalkVideo(speak)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns the matching video url found via SearXNG", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ url: "https://youtube.com/watch?v=abc", title: "Julien Topçu - OAuth 2.1 expliqué simplement" }],
      }),
    } as Response);

    const speak = { conference: { name: "MixIT" }, speakers: [topcu], title: "OAuth 2.1 expliqué simplement" };

    await expect(findTalkVideo(speak)).resolves.toBe("https://youtube.com/watch?v=abc");
  });

  it("returns null when no search result mentions the speaker", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ url: "https://youtube.com/watch?v=x", title: "Unrelated video" }] }),
    } as Response);

    const speak = { conference: { name: "MixIT" }, speakers: [topcu], title: "OAuth 2.1 expliqué simplement" };

    await expect(findTalkVideo(speak)).resolves.toBeNull();
  });
});
