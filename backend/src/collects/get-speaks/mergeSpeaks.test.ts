import { describe, it, expect } from "vitest";
import { mergeSpeaks } from "./mergeSpeaks.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" };
const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };
const breizhcamp = { name: "BreizhCamp", url: "https://www.breizhcamp.org" };

describe("mergeSpeaks", () => {
  it("adds a newly found talk", () => {
    const existing = [{ conference: breizhcamp, speaker: alice, title: "Intro TDD" }];
    const found = [{ conference: breizhcamp, speaker: bob, title: "GraphQL 101" }];

    expect(mergeSpeaks(existing, found)).toEqual([
      { conference: breizhcamp, speaker: alice, title: "Intro TDD" },
      { conference: breizhcamp, speaker: bob, title: "GraphQL 101" },
    ]);
  });

  it("deduplicates an identical talk found again on a later run", () => {
    const existing = [{ conference: breizhcamp, speaker: alice, title: "Intro TDD" }];
    const found = [{ conference: breizhcamp, speaker: alice, title: "Intro TDD" }];

    expect(mergeSpeaks(existing, found)).toEqual(existing);
  });

  it("updates the title on a re-run instead of creating a duplicate", () => {
    const existing = [{ conference: breizhcamp, speaker: alice, title: null }];
    const found = [{ conference: breizhcamp, speaker: alice, title: "Intro TDD" }];

    expect(mergeSpeaks(existing, found)).toEqual([
      { conference: breizhcamp, speaker: alice, title: "Intro TDD" },
    ]);
  });

  it("keeps a talk absent from a later run", () => {
    const existing = [{ conference: breizhcamp, speaker: alice, title: "Intro TDD" }];

    expect(mergeSpeaks(existing, [])).toEqual(existing);
  });
});
