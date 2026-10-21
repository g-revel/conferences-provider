import { describe, it, expect, vi, beforeEach } from "vitest";

const { readJsonMock, writeJsonMock } = vi.hoisted(() => ({
  readJsonMock: vi.fn(),
  writeJsonMock: vi.fn(),
}));

vi.mock("../data/jsonStore.js", () => ({ readJson: readJsonMock, writeJson: writeJsonMock }));

import { buildApp } from "../app.js";
import { TALKS_PATH, SPEAKER_CITY_OVERRIDES_PATH } from "../data/paths.js";

function mockReadJson(talks: unknown[], overrides: unknown[] = []): void {
  readJsonMock.mockImplementation(async (path: string) => {
    if (path === TALKS_PATH) return talks;
    if (path === SPEAKER_CITY_OVERRIDES_PATH) return overrides;
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
      { firstname: "Alice", lastname: "Martin", company: "Shodo", city: null },
      { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes", city: null },
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

    expect(response.json()).toEqual([{ firstname: "Alice", lastname: "Martin", company: "Shodo", city: "Rennes" }]);
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
