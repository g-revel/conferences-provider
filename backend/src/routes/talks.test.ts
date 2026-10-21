import { describe, it, expect, vi, beforeEach } from "vitest";

const { readJsonMock } = vi.hoisted(() => ({ readJsonMock: vi.fn() }));

vi.mock("../data/jsonStore.js", () => ({ readJson: readJsonMock }));

import { buildApp } from "../app.js";
import { TALKS_PATH, SPEAKER_CITY_OVERRIDES_PATH } from "../data/paths.js";

// readJson est appelé pour deux fichiers différents dans cette route (talks.json et
// les overrides de ville) : on distingue par chemin plutôt qu'un mock global unique.
function mockReadJson(talks: unknown[], overrides: unknown[] = []): void {
  readJsonMock.mockImplementation(async (path: string) => {
    if (path === TALKS_PATH) return talks;
    if (path === SPEAKER_CITY_OVERRIDES_PATH) return overrides;
    return [];
  });
}

beforeEach(() => {
  readJsonMock.mockReset();
});

describe("GET /api/talks", () => {
  it("returns the talks read from the static store", async () => {
    const talks = [
      {
        conference: { name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" },
        speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
        title: "Intro TDD",
        videoUrl: "https://www.youtube.com/watch?v=abc123",
      },
    ];
    mockReadJson(talks);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(talks);
  });

  it("never serves a talk without a title", async () => {
    const titled = {
      conference: { name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" },
      speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
      title: "Intro TDD",
      videoUrl: "https://www.youtube.com/watch?v=abc123",
    };
    const untitled = {
      conference: { name: "MixIT", url: "https://mixitconf.org/schedule" },
      speakers: [{ firstname: "Bob", lastname: "Dupont", company: "Shodo" }],
      title: null,
      videoUrl: "https://www.youtube.com/watch?v=def456",
    };
    mockReadJson([titled, untitled]);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.json()).toEqual([titled]);
  });

  it("never serves a deleted talk", async () => {
    const active = {
      conference: { name: "BreizhCamp" },
      speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
      title: "Intro TDD",
      videoUrl: "https://www.youtube.com/watch?v=abc123",
    };
    const deleted = {
      conference: { name: "MixIT" },
      speakers: [{ firstname: "Bob", lastname: "Dupont", company: "Shodo" }],
      title: "Supprimé",
      videoUrl: "https://www.youtube.com/watch?v=def456",
      deletedAt: "2026-01-01T00:00:00.000Z",
    };
    mockReadJson([active, deleted]);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.json()).toEqual([active]);
  });

  it("overlays an admin-set city override onto the matching speaker", async () => {
    const talk = {
      conference: { name: "BreizhCamp" },
      speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
      title: "Intro TDD",
      videoUrl: "https://www.youtube.com/watch?v=abc123",
    };
    mockReadJson([talk], [{ firstname: "Alice", lastname: "Martin", city: "Rennes" }]);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.json()[0].speakers[0].city).toBe("Rennes");
  });

  it("never serves a talk without a videoUrl, even with a pending candidate", async () => {
    const pending = {
      conference: { name: "BreizhCamp" },
      speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
      title: "Intro TDD",
      pendingVideoUrl: "https://www.youtube.com/watch?v=candidate",
    };
    mockReadJson([pending]);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.json()).toEqual([]);
  });

  it("serves a talk without a videoUrl when showWithoutLink is true", async () => {
    const shown = {
      conference: { name: "BreizhCamp" },
      speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
      title: "Intro TDD",
      showWithoutLink: true,
    };
    mockReadJson([shown]);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.json()).toEqual([shown]);
  });
});
