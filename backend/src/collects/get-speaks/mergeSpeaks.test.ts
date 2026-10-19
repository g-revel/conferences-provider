import { describe, it, expect } from "vitest";
import { mergeSpeaks } from "./mergeSpeaks.js";
import type { Speak } from "./speak.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" };
const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };
const breizhcamp = { name: "BreizhCamp", url: "https://www.breizhcamp.org" };

// `id` est généré (uuid aléatoire) : on l'ignore dans les comparaisons de contenu,
// sauf dans les tests dédiés à ce comportement.
function stripIds(speaks: Speak[]): Omit<Speak, "id">[] {
  return speaks.map(({ id, ...rest }) => rest);
}

describe("mergeSpeaks", () => {
  it("adds a newly found talk", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "GraphQL 101" }];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual([
      { conference: breizhcamp, speakers: [alice], title: "Intro TDD" },
      { conference: breizhcamp, speakers: [bob], title: "GraphQL 101" },
    ]);
  });

  it("deduplicates an identical talk found again on a later run", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];
    const found = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual(stripIds(existing as Speak[]));
  });

  it("replaces a null-titled entry once the title is found on a later run", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: null }];
    const found = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual([
      { conference: breizhcamp, speakers: [alice], title: "Intro TDD" },
    ]);
  });

  it("keeps a talk absent from a later run", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    expect(stripIds(mergeSpeaks(existing, []))).toEqual(stripIds(existing as Speak[]));
  });

  it("merges a co-presenter discovered for an already-known titled talk", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice], title: "Accessibilité" }];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "Accessibilité" }];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual([
      { conference: breizhcamp, speakers: [alice, bob], title: "Accessibilité" },
    ]);
  });

  it("does not duplicate a speaker already part of the known group", () => {
    const existing = [{ conference: breizhcamp, speakers: [alice, bob], title: "Accessibilité" }];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "Accessibilité" }];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual(stripIds(existing as Speak[]));
  });

  it("drops a stale null-titled entry for a speaker now known to be part of a titled group", () => {
    const existing = [
      { conference: breizhcamp, speakers: [alice], title: "Accessibilité" },
      { conference: breizhcamp, speakers: [bob], title: null },
    ];
    const found = [{ conference: breizhcamp, speakers: [bob], title: "Accessibilité" }];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual([
      { conference: breizhcamp, speakers: [alice, bob], title: "Accessibilité" },
    ]);
  });

  it("keeps two different speakers without a title as separate entries", () => {
    const existing: Speak[] = [];
    const found = [
      { conference: breizhcamp, speakers: [alice], title: null },
      { conference: breizhcamp, speakers: [bob], title: null },
    ];

    expect(stripIds(mergeSpeaks(existing, found))).toEqual(stripIds(found as Speak[]));
  });

  it("assigns a stable, unique id to every entry", () => {
    const found = [
      { conference: breizhcamp, speakers: [alice], title: "Intro TDD" },
      { conference: breizhcamp, speakers: [bob], title: "GraphQL 101" },
    ];

    const result = mergeSpeaks([], found);

    expect(result[0].id).toBeTypeOf("string");
    expect(result[1].id).toBeTypeOf("string");
    expect(result[0].id).not.toBe(result[1].id);
  });

  it("preserves an existing entry's id across runs instead of generating a new one", () => {
    const existing: Speak[] = [{ id: "fixed-id", conference: breizhcamp, speakers: [alice], title: "Intro TDD" }];

    const result = mergeSpeaks(existing, []);

    expect(result[0].id).toBe("fixed-id");
  });
});
