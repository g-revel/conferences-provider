import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVideoPublishYear } from "./fetchVideoPublishYear.js";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchVideoPublishYear", () => {
  it("extracts the year from the datePublished meta tag", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => '<html><meta itemprop="datePublished" content="2026-06-08T08:37:13-07:00"></html>',
    } as Response);

    await expect(fetchVideoPublishYear("https://www.youtube.com/watch?v=abc")).resolves.toBe(2026);
  });

  it("returns null when the meta tag is absent", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => "<html></html>",
    } as Response);

    await expect(fetchVideoPublishYear("https://www.youtube.com/watch?v=abc")).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    await expect(fetchVideoPublishYear("https://www.youtube.com/watch?v=abc")).resolves.toBeNull();
  });
});
