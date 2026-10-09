import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractSpeaksFromConference } from "./extract-speaks.js";

vi.mock("undici", async () => {
  const actual = await vi.importActual<typeof import("undici")>("undici");
  return { ...actual, fetch: vi.fn() };
});

const { fetch } = await import("undici");

beforeEach(() => {
  vi.mocked(fetch).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("extractSpeaksFromConference", () => {
  it("returns no talk when the conference has no url", async () => {
    await expect(extractSpeaksFromConference({ name: "BreizhCamp", url: null }, [])).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignores a page that doesn't even mention the conference name", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        "<html><body>Super formation, juste envie d'en apprendre encore plus. David C. - Franck K.</body></html>",
    } as Response);

    const result = await extractSpeaksFromConference(
      { name: "Human Talks Nantes", url: "https://www.humancoders.com/formations/typescript" },
      [{ firstname: "David", lastname: "Franck", company: "Shodo" }],
    );

    expect(result).toEqual([]);
  });
});
