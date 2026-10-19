import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findSpeakerTalksOnYoutube } from "./findSpeakerTalksOnYoutube.js";

vi.mock("undici", async () => {
  const actual = await vi.importActual<typeof import("undici")>("undici");
  return { ...actual, fetch: vi.fn() };
});

const { fetch: undiciFetch } = await import("undici");

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const pierrain = { firstname: "Thomas", lastname: "Pierrain", company: "Shodo" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.mocked(undiciFetch).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("findSpeakerTalksOnYoutube", () => {
  it("builds a Speak with detected co-presenters for a genuine conference talk", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            url: "https://youtube.com/watch?v=abc",
            title: "The Hive pattern (Julien Topçu & Thomas Pierrain) #MiXiT2025",
            author: "MiXiT",
            length: "45:33",
          },
        ],
      }),
    } as Response);

    vi.mocked(undiciFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: {
          content: JSON.stringify({
            isConferenceTalk: true,
            conferenceName: "MiXiT",
            title: "The Hive pattern",
          }),
        },
      }),
    } as Response);

    const result = await findSpeakerTalksOnYoutube(topcu, [topcu, pierrain]);

    expect(result).toEqual([
      {
        id: expect.any(String),
        conference: { name: "MiXiT" },
        speakers: [topcu, pierrain],
        title: "The Hive pattern",
        videoUrl: "https://youtube.com/watch?v=abc",
      },
    ]);
  });

  it("skips a short video without even calling the LLM", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ url: "https://youtube.com/watch?v=short", title: "A trailer", author: "X", length: "00:30" }],
      }),
    } as Response);

    const result = await findSpeakerTalksOnYoutube(topcu, [topcu]);

    expect(result).toEqual([]);
    expect(undiciFetch).not.toHaveBeenCalled();
  });

  it("skips a video the model doesn't classify as a genuine conference talk", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ url: "https://youtube.com/watch?v=interview", title: "An interview", author: "X", length: "20:00" }],
      }),
    } as Response);

    vi.mocked(undiciFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { content: JSON.stringify({ isConferenceTalk: false, conferenceName: null, title: null }) },
      }),
    } as Response);

    const result = await findSpeakerTalksOnYoutube(topcu, [topcu]);

    expect(result).toEqual([]);
  });
});
