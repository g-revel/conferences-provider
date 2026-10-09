import { describe, it, expect } from "vitest";
import { mergeSpeaks } from "./mergeSpeaks.js";
import type { Speak } from "./speak.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" };
const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };
const breizhcamp = { name: "BreizhCamp", url: "https://www.breizhcamp.org" };

describe("mergeSpeaks", () => {
  it("adds a newly found talk", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "GraphQL 101" }];

    expect(mergeSpeaks(existing, found)).toEqual([
      { conference: breizhcamp, speakers: [alice], title: "Intro TDD" },
      { conference: breizhcamp, speakers: [bob], title: "GraphQL 101" },
    ]);
  });

  it("deduplicates an identical talk found again on a later run", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];
    const found = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    expect(mergeSpeaks(existing, found)).toEqual(existing);
  });

  it("replaces a null-titled entry once the title is found on a later run", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: null }];
    const found = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    expect(mergeSpeaks(existing, found)).toEqual([
      { conference: breizhcamp, speakers: [alice], title: "Intro TDD" },
    ]);
  });

  it("keeps a talk absent from a later run", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    expect(mergeSpeaks(existing, [])).toEqual(existing);
  });

  it("merges a co-presenter discovered for an already-known titled talk", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Accessibilité" }];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "Accessibilité" }];

    expect(mergeSpeaks(existing, found)).toEqual([
      { conference: breizhcamp, speakers: [alice, bob], title: "Accessibilité" },
    ]);
  });

  it("does not duplicate a speaker already part of the known group", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice, bob], title: "Accessibilité" }];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "Accessibilité" }];

    expect(mergeSpeaks(existing, found)).toEqual(existing);
  });

  it("drops a stale null-titled entry for a speaker now known to be part of a titled group", () => {
    const existing = [
      { conference: breizhcamp, speakers: [alice], title: "Accessibilité" },
      { conference: breizhcamp, speakers: [bob], title: null },
    ];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "Accessibilité" }];

    expect(mergeSpeaks(existing, found)).toEqual([
      { conference: breizhcamp, speakers: [alice, bob], title: "Accessibilité" },
    ]);
  });

  it("keeps two different speakers without a title as separate entries", () => {
    const existing: Speak[] = [];
    const found = [
      { conference: breizhcamp, speakers: [alice], title: null },
      { conference: breizhcamp, speakers: [bob], title: null },
    ];

    expect(mergeSpeaks(existing, found)).toEqual(found);
  });
});
