import { describe, it, expect, vi, beforeEach } from "vitest";

const { readJsonMock } = vi.hoisted(() => ({ readJsonMock: vi.fn() }));

vi.mock("../../data/jsonStore.js", () => ({ readJson: readJsonMock }));

import { getConferences } from "./get-conferences.js";

beforeEach(() => {
  readJsonMock.mockReset();
});

describe("getConferences", () => {
  it("returns the conferences read from the static store", async () => {
    readJsonMock.mockResolvedValue([{ name: "Devoxx France", url: null }]);

    const conferences = await getConferences();

    expect(conferences).toEqual([{ name: "Devoxx France", url: null }]);
  });

  it("falls back to an empty list when the store is empty", async () => {
    readJsonMock.mockResolvedValue([]);

    const conferences = await getConferences();

    expect(conferences).toEqual([]);
  });
});
