import { describe, it, expect } from "vitest";
import { parseExtractionResponse } from "./parseExtractionResponse.js";

const conference = { name: "BreizhCamp", url: "https://www.breizhcamp.org" };
const knownSpeakers = [
  { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" },
  { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" },
];

describe("parseExtractionResponse", () => {
  it("maps a matched name to the canonical known speaker when the name is on the page", () => {
    const raw = JSON.stringify({ matches: [{ firstname: "Alice", lastname: "Martin", title: "Intro TDD" }] });
    const pageText = "9h00 Intro TDD par Alice Martin";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: "Intro TDD" },
    ]);
  });

  it("matches regardless of case or accents", () => {
    const raw = JSON.stringify({ matches: [{ firstname: "alice", lastname: "MARTIN", title: null }] });
    const pageText = "alice martin donnera un talk";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: null },
    ]);
  });

  it("discards a name that is not in the known speakers list", () => {
    const raw = JSON.stringify({ matches: [{ firstname: "Someone", lastname: "Invented", title: "Fake talk" }] });

    expect(parseExtractionResponse(raw, conference, knownSpeakers, "Someone Invented is speaking")).toEqual([]);
  });

  it("discards a known name that the model invented despite it not being on the page", () => {
    const raw = JSON.stringify({ matches: [{ firstname: "Alice", lastname: "Martin", title: "Fabricated" }] });
    const pageText = "Cette page ne mentionne aucun intervenant.";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([]);
  });

  it("returns an empty list when matches is absent", () => {
    expect(parseExtractionResponse(JSON.stringify({}), conference, knownSpeakers, "")).toEqual([]);
  });

  it("discards a short surname that only matches as a substring of another word", () => {
    const shortNameSpeaker = { firstname: "Jean", lastname: "Vo", company: "Shodo" };
    const raw = JSON.stringify({ matches: [{ firstname: "Jean", lastname: "Vo", title: "Fabricated" }] });
    // "Vo" apparaît dans "avoir", mais ni "Jean" ni "Vo" n'y figurent en tant que mots entiers.
    const pageText = "Il faut avoir confiance en soi.";

    expect(
      parseExtractionResponse(raw, conference, [...knownSpeakers, shortNameSpeaker], pageText),
    ).toEqual([]);
  });

  it("requires both the firstname and the lastname to appear, not just one of them", () => {
    const raw = JSON.stringify({ matches: [{ firstname: "Alice", lastname: "Martin", title: "Fabricated" }] });
    const pageText = "Le talk est donné par Martin Dupont, un conférencier renommé."; // "Martin" en tant que prénom d'une autre personne

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([]);
  });

  it("deduplicates a person cited twice, preferring the non-null title regardless of order", () => {
    const rawTitleFirst = JSON.stringify({
      matches: [
        { firstname: "Alice", lastname: "Martin", title: null },
        { firstname: "Alice", lastname: "Martin", title: "Orchestrez vos agents IA" },
      ],
    });
    const rawTitleLast = JSON.stringify({
      matches: [
        { firstname: "Alice", lastname: "Martin", title: "Orchestrez vos agents IA" },
        { firstname: "Alice", lastname: "Martin", title: null },
      ],
    });
    const pageTextWithName = "9h00 Orchestrez vos agents IA par Alice Martin";

    expect(parseExtractionResponse(rawTitleFirst, conference, knownSpeakers, pageTextWithName)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: "Orchestrez vos agents IA" },
    ]);
    expect(parseExtractionResponse(rawTitleLast, conference, knownSpeakers, pageTextWithName)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: "Orchestrez vos agents IA" },
    ]);
  });

  it("decodes a literal \\u0027 escape artifact left in the title by the model", () => {
    const raw = JSON.stringify({
      matches: [{ firstname: "Alice", lastname: "Martin", title: "l\\u0027architecture hexagonale" }],
    });
    const pageText = "9h00 l'architecture hexagonale par Alice Martin";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: "l'architecture hexagonale" },
    ]);
  });

  it("decodes a literal HTML entity left in the title by the model", () => {
    const raw = JSON.stringify({
      matches: [{ firstname: "Alice", lastname: "Martin", title: "l&#39;architecture hexagonale" }],
    });
    const pageText = "9h00 l'architecture hexagonale par Alice Martin";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: "l'architecture hexagonale" },
    ]);
  });

  it("discards a hashtag mistaken for a title (site theme, not a real talk title)", () => {
    const raw = JSON.stringify({ matches: [{ firstname: "Alice", lastname: "Martin", title: "#BackToSchool" }] });
    const pageText = "BreizhCamp 2026 - Alice Martin #BackToSchool";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: null },
    ]);
  });

  it("salvages complete match objects from a truncated JSON response", () => {
    const raw = '{"matches": [{"firstname": "Alice", "lastname": "Martin", "title": "Intro TDD"}, {"firstname": "Bob",';
    const pageText = "9h00 Intro TDD par Alice Martin";

    expect(parseExtractionResponse(raw, conference, knownSpeakers, pageText)).toEqual([
      { conference, speakers: [knownSpeakers[0]], title: "Intro TDD" },
    ]);
  });
});
