import { describe, it, expect, vi, beforeEach } from "vitest";

const { readConferencesMock } = vi.hoisted(() => ({ readConferencesMock: vi.fn() }));

vi.mock("../../data/conferencesStore.js", () => ({ readConferences: readConferencesMock }));

import { getConferences } from "./get-conferences.js";

beforeEach(() => {
  readConferencesMock.mockReset();
});

describe("getConferences", () => {
  it("returns the conferences read from the static store", async () => {
    readConferencesMock.mockResolvedValue([{ name: "Devoxx France", url: null }]);

    const conferences = await getConferences();

    expect(conferences).toEqual([{ name: "Devoxx France", url: null }]);
  });

  it("falls back to an empty list when the store is empty", async () => {
    readConferencesMock.mockResolvedValue([]);

    const conferences = await getConferences();

    expect(conferences).toEqual([]);
  });
});
