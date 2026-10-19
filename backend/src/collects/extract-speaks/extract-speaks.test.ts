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

  it("falls back to the context window when the dedicated profile page has no title", async () => {
    const castelein = { firstname: "Nathan", lastname: "Castelein", company: "Shodo Lille" };
    const conference = { name: "Touraine Tech", url: "https://touraine.tech/" };

    const mainPageHtml =
      "<html><body>Touraine Tech - Nos speakers " +
      '<a href="/speaker/Nathan_Castelein"><h3>Nathan Castelein</h3></a>' +
      " Le programme : Le DDD c'est compliqué Nathan Castelein</body></html>";
    const profilePageHtml = "<html><body>Touraine Tech - Nathan Castelein bio only, no talk title here</body></html>";

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, text: async () => mainPageHtml } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => profilePageHtml } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify({ matches: [{ firstname: "Nathan", lastname: "Castelein", title: null }] }),
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: JSON.stringify({
              matches: [{ firstname: "Nathan", lastname: "Castelein", title: "Le DDD c'est compliqué" }],
            }),
          },
        }),
      } as Response);

    const result = await extractSpeaksFromConference(conference, [castelein]);

    expect(result).toEqual([
      { id: expect.any(String), conference, speakers: [castelein], title: "Le DDD c'est compliqué" },
    ]);
  });
});
