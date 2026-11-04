import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  readSpeakersMock,
  readConferencesMock,
  readTalksMock,
  writeTalksMock,
  findSpeakerTalksOnYoutubeMock,
  extractSpeaksFromConferenceMock,
} = vi.hoisted(() => ({
  readSpeakersMock: vi.fn(),
  readConferencesMock: vi.fn(),
  readTalksMock: vi.fn(),
  writeTalksMock: vi.fn(),
  findSpeakerTalksOnYoutubeMock: vi.fn(),
  extractSpeaksFromConferenceMock: vi.fn(),
}));

vi.mock("../data/speakersStore.js", () => ({ readSpeakers: readSpeakersMock }));
vi.mock("../data/conferencesStore.js", () => ({ readConferences: readConferencesMock }));
vi.mock("../data/talksStore.js", () => ({
  readTalks: readTalksMock,
  readTalkById: vi.fn(),
  writeTalks: writeTalksMock,
}));
// admin.ts (chargé avec adminSearch.ts via app.ts) importe aussi ces stores — à
// mocker même si adminSearch.ts ne s'en sert pas, sinon les vrais modules se
// chargent et tentent une connexion Postgres réelle (DATABASE_URL absent en test).
vi.mock("../data/speakerCityOverridesStore.js", () => ({
  readSpeakerCityOverrides: vi.fn().mockResolvedValue([]),
  writeSpeakerCityOverrides: vi.fn(),
}));
vi.mock("../data/speakerMemberOverridesStore.js", () => ({
  readSpeakerMemberOverrides: vi.fn().mockResolvedValue([]),
  writeSpeakerMemberOverrides: vi.fn(),
}));
vi.mock("../data/knownCitiesStore.js", () => ({
  readKnownCities: vi.fn().mockResolvedValue([]),
  writeKnownCities: vi.fn(),
}));
vi.mock("../collects/find-speaker-talks-on-youtube/findSpeakerTalksOnYoutube.js", () => ({
  findSpeakerTalksOnYoutube: findSpeakerTalksOnYoutubeMock,
}));
vi.mock("../collects/extract-speaks/extract-speaks.js", () => ({
  extractSpeaksFromConference: extractSpeaksFromConferenceMock,
}));

import { buildApp } from "../app.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo" };

beforeEach(() => {
  readSpeakersMock.mockReset().mockResolvedValue([alice]);
  readConferencesMock.mockReset().mockResolvedValue([]);
  readTalksMock.mockReset().mockResolvedValue([]);
  writeTalksMock.mockReset();
  findSpeakerTalksOnYoutubeMock.mockReset();
  extractSpeaksFromConferenceMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth", () => {
  it("rejects a search route without a password, same as other admin routes", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/admin/search/status" });

    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/admin/search/status", () => {
  it("reports both services reachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/search/status",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual({ searxng: true, ollama: true });
  });

  it("reports a service unreachable when the ping throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/search/status",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual({ searxng: false, ollama: false });
  });
});

describe("GET /api/admin/search/conferences", () => {
  it("returns the seeded conferences", async () => {
    readConferencesMock.mockResolvedValue([{ name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" }]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/search/conferences",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual([{ name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" }]);
  });
});

describe("POST /api/admin/search/talker", () => {
  it("rejects a request missing firstname or lastname", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/talker",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for an unknown speaker", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/talker",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Unknown", lastname: "Person" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns the candidates found on YouTube for the speaker", async () => {
    findSpeakerTalksOnYoutubeMock.mockResolvedValue([
      {
        id: "candidate-1",
        conference: { name: "BreizhCamp" },
        speakers: [alice],
        title: "Un nouveau talk",
        videoUrl: "https://www.youtube.com/watch?v=new",
      },
    ]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/talker",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0].title).toBe("Un nouveau talk");
    expect(findSpeakerTalksOnYoutubeMock).toHaveBeenCalledWith(alice, [alice]);
  });

  it("filters out a candidate whose videoUrl is already a known talk", async () => {
    readTalksMock.mockResolvedValue([
      {
        id: "existing-1",
        conference: { name: "BreizhCamp" },
        speakers: [alice],
        title: "Déjà connu",
        videoUrl: "https://www.youtube.com/watch?v=already-known",
      },
    ]);
    findSpeakerTalksOnYoutubeMock.mockResolvedValue([
      {
        id: "candidate-1",
        conference: { name: "BreizhCamp" },
        speakers: [alice],
        title: "Autre titre",
        videoUrl: "https://www.youtube.com/watch?v=already-known",
      },
    ]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/talker",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin" },
    });

    expect(response.json()).toEqual([]);
  });

  it("returns 503 with a clear message when SearXNG/Ollama are unreachable", async () => {
    findSpeakerTalksOnYoutubeMock.mockRejectedValue(new Error("fetch failed"));
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/talker",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toMatch(/local/i);
  });
});

describe("POST /api/admin/search/event", () => {
  it("rejects a request missing conferenceName", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/event",
      headers: { "x-admin-password": "Shodo" },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for a conference outside the seed list", async () => {
    readConferencesMock.mockResolvedValue([{ name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" }]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/event",
      headers: { "x-admin-password": "Shodo" },
      payload: { conferenceName: "Unknown Conf" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("crawls the conference's known edition URLs and returns new candidates", async () => {
    readConferencesMock.mockResolvedValue([
      {
        name: "BreizhCamp",
        url: "https://www.breizhcamp.org/programme",
        pastEditionUrls: ["https://2025.breizhcamp.org/"],
      },
    ]);
    extractSpeaksFromConferenceMock.mockResolvedValue([
      { id: "c1", conference: { name: "BreizhCamp" }, speakers: [alice], title: "Trouvé sur la page" },
    ]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/event",
      headers: { "x-admin-password": "Shodo" },
      payload: { conferenceName: "BreizhCamp" },
    });

    expect(response.statusCode).toBe(200);
    expect(extractSpeaksFromConferenceMock).toHaveBeenCalledTimes(2);
    expect(response.json()).toHaveLength(2);
  });

  it("returns 503 with a clear message when SearXNG/Ollama are unreachable", async () => {
    readConferencesMock.mockResolvedValue([{ name: "BreizhCamp", url: "https://www.breizhcamp.org/programme" }]);
    extractSpeaksFromConferenceMock.mockRejectedValue(new Error("fetch failed"));
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/event",
      headers: { "x-admin-password": "Shodo" },
      payload: { conferenceName: "BreizhCamp" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toMatch(/local/i);
  });
});

describe("POST /api/admin/search/accept", () => {
  it("rejects a request missing the talk", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/accept",
      headers: { "x-admin-password": "Shodo" },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("merges the accepted candidate with existing talks and persists it", async () => {
    const candidate = {
      id: "candidate-1",
      conference: { name: "BreizhCamp" },
      speakers: [alice],
      title: "Un nouveau talk",
      videoUrl: "https://www.youtube.com/watch?v=new",
    };
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/search/accept",
      headers: { "x-admin-password": "Shodo" },
      payload: { talk: candidate },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });
    expect(writeTalksMock).toHaveBeenCalledWith([expect.objectContaining({ title: "Un nouveau talk" })]);
  });
});
