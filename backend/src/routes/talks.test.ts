import { describe, it, expect, vi, beforeEach } from "vitest";

const { readJsonMock } = vi.hoisted(() => ({ readJsonMock: vi.fn() }));

vi.mock("../data/jsonStore.js", () => ({ readJson: readJsonMock }));

import { buildApp } from "../app.js";

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
      },
    ];
    readJsonMock.mockResolvedValue(talks);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/api/talks" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(talks);
  });
});
