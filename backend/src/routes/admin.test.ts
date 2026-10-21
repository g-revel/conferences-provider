import { describe, it, expect, vi, beforeEach } from "vitest";

const { readJsonMock, writeJsonMock } = vi.hoisted(() => ({
  readJsonMock: vi.fn(),
  writeJsonMock: vi.fn(),
}));

vi.mock("../data/jsonStore.js", () => ({ readJson: readJsonMock, writeJson: writeJsonMock }));

import { buildApp } from "../app.js";
import {
  TALKS_PATH,
  SPEAKER_CITY_OVERRIDES_PATH,
  SPEAKER_MEMBER_OVERRIDES_PATH,
  SPEAKERS_PATH,
  KNOWN_CITIES_PATH,
} from "../data/paths.js";

function mockReadJson(
  talks: unknown[],
  overrides: unknown[] = [],
  cities: unknown[] = [],
  speakers: unknown[] = [],
  memberOverrides: unknown[] = [],
): void {
  readJsonMock.mockImplementation(async (path: string) => {
    if (path === TALKS_PATH) return talks;
    if (path === SPEAKER_CITY_OVERRIDES_PATH) return overrides;
    if (path === KNOWN_CITIES_PATH) return cities;
    if (path === SPEAKERS_PATH) return speakers;
    if (path === SPEAKER_MEMBER_OVERRIDES_PATH) return memberOverrides;
    return [];
  });
}

beforeEach(() => {
  readJsonMock.mockReset();
  writeJsonMock.mockReset();
});

const talk1 = {
  id: "talk-1",
  conference: { name: "BreizhCamp" },
  speakers: [{ firstname: "Alice", lastname: "Martin", company: "Shodo" }],
  title: "Intro TDD",
};
const talk2 = {
  id: "talk-2",
  conference: { name: "MixIT" },
  speakers: [
    { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" },
    { firstname: "Alice", lastname: "Martin", company: "Shodo" },
  ],
  title: "GraphQL 101",
};

describe("admin auth", () => {
  it("rejects a request to an admin route without a password", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/admin/talkers" });

    expect(response.statusCode).toBe(401);
  });

  it("rejects a request to an admin route with the wrong password", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "wrong" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("does not require a password on the public /api/talks route", async () => {
    mockReadJson([]);
    const app = await buildApp();

    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.statusCode).toBe(200);
  });
});

describe("POST /api/admin/login", () => {
  it("accepts the correct password", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "POST", url: "/api/admin/login", payload: { password: "Shodo" } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ valid: true });
  });

  it("rejects a wrong password", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "POST", url: "/api/admin/login", payload: { password: "nope" } });

    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/admin/talkers", () => {
  it("returns the unique speakers found across all talks, sorted", async () => {
    mockReadJson([talk1, talk2]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: null, active: true },
      { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes", city: "Rennes", active: true },
    ]);
  });

  it("reflects an existing city override", async () => {
    mockReadJson([talk1], [{ firstname: "Alice", lastname: "Martin", city: "Rennes" }]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: "Rennes", active: true },
    ]);
  });

  it("falls back to the city derived from company when there is no override", async () => {
    mockReadJson([talk2], []);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: null, active: true },
      { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes", city: "Rennes", active: true },
    ]);
  });

  it("an override explicitly set to null wins over the derived city (forces \"(aucune)\")", async () => {
    mockReadJson([talk2], [{ firstname: "Bob", lastname: "Dupont", city: null }]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: null, active: true },
      { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes", city: null, active: true },
    ]);
  });

  it("reflects the active status derived from speakers.json when there is no member override", async () => {
    mockReadJson([talk1], [], [], [{ firstname: "Alice", lastname: "Martin", company: "Shodo", active: false }]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: null, active: false },
    ]);
  });

  it("a manual member override wins over the status derived from speakers.json", async () => {
    mockReadJson(
      [talk1],
      [],
      [],
      [{ firstname: "Alice", lastname: "Martin", company: "Shodo", active: true }],
      [{ firstname: "Alice", lastname: "Martin", active: false }],
    );
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talkers",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: null, active: false },
    ]);
  });
});

describe("PUT /api/admin/talkers/active", () => {
  it("persists a new member override marking someone as having left Shodo", async () => {
    mockReadJson([talk1], [], [], []);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/active",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin", active: false },
    });

    expect(response.statusCode).toBe(200);
    expect(writeJsonMock).toHaveBeenCalledWith(
      SPEAKER_MEMBER_OVERRIDES_PATH,
      [{ firstname: "Alice", lastname: "Martin", active: false }],
    );
  });

  it("replaces an existing override for the same person instead of duplicating it", async () => {
    mockReadJson([talk1], [], [], [], [{ firstname: "Alice", lastname: "Martin", active: false }]);
    const app = await buildApp();

    await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/active",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin", active: true },
    });

    expect(writeJsonMock).toHaveBeenCalledWith(
      SPEAKER_MEMBER_OVERRIDES_PATH,
      [{ firstname: "Alice", lastname: "Martin", active: true }],
    );
  });

  it("rejects a request missing firstname, lastname or a boolean active", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/active",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin", active: "nope" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/admin/talkers/city", () => {
  it("persists a new city override", async () => {
    mockReadJson([talk1], []);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/city",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin", city: "Rennes" },
    });

    expect(response.statusCode).toBe(200);
    expect(writeJsonMock).toHaveBeenCalledWith(
      SPEAKER_CITY_OVERRIDES_PATH,
      [{ firstname: "Alice", lastname: "Martin", city: "Rennes" }],
    );
  });

  it("replaces an existing override for the same person instead of duplicating it", async () => {
    mockReadJson([talk1], [{ firstname: "Alice", lastname: "Martin", city: "Lyon" }]);
    const app = await buildApp();

    await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/city",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin", city: "Rennes" },
    });

    expect(writeJsonMock).toHaveBeenCalledWith(
      SPEAKER_CITY_OVERRIDES_PATH,
      [{ firstname: "Alice", lastname: "Martin", city: "Rennes" }],
    );
  });

  it("clears an override when city is empty", async () => {
    mockReadJson([talk1], [{ firstname: "Alice", lastname: "Martin", city: "Lyon" }]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/city",
      headers: { "x-admin-password": "Shodo" },
      payload: { firstname: "Alice", lastname: "Martin", city: "" },
    });

    expect(response.json()).toEqual({ firstname: "Alice", lastname: "Martin", city: null });
  });

  it("rejects a request missing firstname or lastname", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talkers/city",
      headers: { "x-admin-password": "Shodo" },
      payload: { city: "Rennes" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /api/admin/talks", () => {
  it("returns every talk, including null-titled and deleted ones", async () => {
    const deleted = { ...talk2, title: null, deletedAt: "2026-01-01T00:00:00.000Z" };
    mockReadJson([talk1, deleted]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/talks",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.json()).toHaveLength(2);
  });
});

describe("DELETE /api/admin/talks/:id", () => {
  it("soft-deletes the talk by setting deletedAt", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/admin/talks/talk-1",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().deletedAt).not.toBeNull();
    expect(writeJsonMock).toHaveBeenCalledWith(
      TALKS_PATH,
      [expect.objectContaining({ id: "talk-1", deletedAt: expect.any(String) })],
    );
  });

  it("returns 404 for an unknown id", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/admin/talks/unknown",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("POST /api/admin/talks/:id/restore", () => {
  it("clears deletedAt", async () => {
    const deleted = { ...talk1, deletedAt: "2026-01-01T00:00:00.000Z" };
    mockReadJson([deleted]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/talks/talk-1/restore",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().deletedAt).toBeNull();
  });
});

describe("PUT /api/admin/talks/:id/video-url", () => {
  it("sets videoUrl and clears pendingVideoUrl", async () => {
    const pending = { ...talk1, pendingVideoUrl: "https://www.youtube.com/watch?v=candidate" };
    mockReadJson([pending]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/video-url",
      headers: { "x-admin-password": "Shodo" },
      payload: { videoUrl: "https://www.youtube.com/watch?v=validated" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().videoUrl).toBe("https://www.youtube.com/watch?v=validated");
    expect(response.json().pendingVideoUrl).toBeNull();
  });

  it("rejects an empty videoUrl", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/video-url",
      headers: { "x-admin-password": "Shodo" },
      payload: { videoUrl: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/unknown/video-url",
      headers: { "x-admin-password": "Shodo" },
      payload: { videoUrl: "https://www.youtube.com/watch?v=validated" },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /api/admin/talks/:id/show-without-link", () => {
  it("sets showWithoutLink", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/show-without-link",
      headers: { "x-admin-password": "Shodo" },
      payload: { showWithoutLink: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().showWithoutLink).toBe(true);
  });

  it("rejects a non-boolean value", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/show-without-link",
      headers: { "x-admin-password": "Shodo" },
      payload: { showWithoutLink: "yes" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /api/admin/cities", () => {
  it("returns the known cities, sorted", async () => {
    mockReadJson([], [], ["Nantes", "Lille"]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/cities",
      headers: { "x-admin-password": "Shodo" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(["Lille", "Nantes"]);
  });
});

describe("POST /api/admin/cities", () => {
  it("adds a new city and persists it", async () => {
    mockReadJson([], [], ["Lille"]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/cities",
      headers: { "x-admin-password": "Shodo" },
      payload: { city: "Bordeaux" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(["Bordeaux", "Lille"]);
    expect(writeJsonMock).toHaveBeenCalledWith(KNOWN_CITIES_PATH, ["Lille", "Bordeaux"]);
  });

  it("does not duplicate a city that already exists, regardless of case or accents", async () => {
    mockReadJson([], [], ["Reunion"]);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/cities",
      headers: { "x-admin-password": "Shodo" },
      payload: { city: "réunion" },
    });

    expect(response.json()).toEqual(["Reunion"]);
    expect(writeJsonMock).not.toHaveBeenCalled();
  });

  it("rejects an empty city", async () => {
    mockReadJson([], [], []);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/cities",
      headers: { "x-admin-password": "Shodo" },
      payload: { city: "  " },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/admin/talks/:id/year", () => {
  it("sets the year", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/year",
      headers: { "x-admin-password": "Shodo" },
      payload: { year: 2025 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().year).toBe(2025);
  });

  it("rejects a non-integer year", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/year",
      headers: { "x-admin-password": "Shodo" },
      payload: { year: 2025.5 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects a year out of range", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/talk-1/year",
      headers: { "x-admin-password": "Shodo" },
      payload: { year: 1500 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    mockReadJson([talk1]);
    const app = await buildApp();

    const response = await app.inject({
      method: "PUT",
      url: "/api/admin/talks/unknown/year",
      headers: { "x-admin-password": "Shodo" },
      payload: { year: 2025 },
    });

    expect(response.statusCode).toBe(404);
  });
});
