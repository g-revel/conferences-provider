import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findTalkYear } from "./findTalkYear.js";
import { Speak } from "../get-speaks/speak.js";

const baseSpeak: Speak = {
  id: "1",
  conference: { name: "BreizhCamp", url: null },
  speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
  title: "Un talk",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("findTalkYear", () => {
  it("prefers the year found in the conference name over fetching the video", async () => {
    const speak: Speak = {
      ...baseSpeak,
      conference: { name: "NewCrafts 2025", url: null },
      videoUrl: "https://www.youtube.com/watch?v=abc",
    };

    await expect(findTalkYear(speak)).resolves.toBe(2025);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to the video publish year when the conference name has none", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '<html><meta itemprop="datePublished" content="2024-01-10"></html>',
    } as Response);

    const speak: Speak = { ...baseSpeak, videoUrl: "https://www.youtube.com/watch?v=abc" };

    await expect(findTalkYear(speak)).resolves.toBe(2024);
  });

  it("returns null when there is neither a year in the name nor a video", async () => {
    await expect(findTalkYear(baseSpeak)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
