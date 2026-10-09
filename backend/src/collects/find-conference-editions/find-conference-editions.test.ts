import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findConferenceEditionUrl, findConferenceEditionUrls } from "./find-conference-editions.js";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("findConferenceEditionUrl", () => {
  it("returns the first result's URL on success", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ url: "https://www.breizhcamp.org/programme" }] }),
    } as Response);

    await expect(findConferenceEditionUrl("BreizhCamp")).resolves.toBe(
      "https://www.breizhcamp.org/programme",
    );
  });

  it("throws on a non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "internal error",
    } as Response);

    await expect(findConferenceEditionUrl("BreizhCamp")).rejects.toThrow(/500/);
  });
});

describe("findConferenceEditionUrls", () => {
  it("searches 5 editions (current year down to -4) and returns the distinct urls found", async () => {
    const currentYear = new Date().getFullYear();
    vi.mocked(fetch).mockImplementation(async (input: unknown) => {
      const requestUrl = String(input);
      const year = Number(new URL(requestUrl).searchParams.get("q")?.match(/(\d{4})/)?.[1]);
      const resultUrl =
        year === currentYear || year === currentYear - 1
          ? `https://example.com/${year}`
          : null;
      return {
        ok: true,
        json: async () => ({ results: resultUrl ? [{ url: resultUrl }] : [] }),
      } as Response;
    });

    const urls = await findConferenceEditionUrls("BreizhCamp");

    expect(fetch).toHaveBeenCalledTimes(5);
    expect(urls).toEqual([`https://example.com/${currentYear}`, `https://example.com/${currentYear - 1}`]);
  });

  it("deduplicates urls found for different years", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ url: "https://example.com/schedule" }] }),
    } as Response);

    const urls = await findConferenceEditionUrls("BreizhCamp");

    expect(urls).toEqual(["https://example.com/schedule"]);
  });

  it("returns an empty array when nothing is found for any year", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    await expect(findConferenceEditionUrls("BreizhCamp")).resolves.toEqual([]);
  });
});
