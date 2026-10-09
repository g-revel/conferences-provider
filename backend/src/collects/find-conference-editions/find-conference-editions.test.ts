import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findConferenceEditionUrl } from "./find-conference-editions.js";

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
