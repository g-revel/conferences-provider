import { describe, it, expect } from "vitest";
import { fillMissingCoPresenterTitles } from "./fillMissingCoPresenterTitles.js";

const conference = { name: "BreizhCamp", url: "https://www.breizhcamp.org" };
const aboaf = { firstname: "Emmanuelle", lastname: "Aboaf", company: "Shodo" };
const carbonnel = { firstname: "Manon", lastname: "Carbonnel", company: "Shodo Rennes" };
const other = { firstname: "Someone", lastname: "Else", company: "Shodo" };

describe("fillMissingCoPresenterTitles", () => {
  it("copies the title from a nearby titled co-presenter", () => {
    const pageText = "Titre du talk Emmanuelle Aboaf Manon Carbonnel 8h00";
    const speaks = [
      { conference, speakers: [aboaf], title: "Titre du talk" },
      { conference, speakers: [carbonnel], title: null },
    ];

    expect(fillMissingCoPresenterTitles(speaks, pageText)).toEqual([
      { conference, speakers: [aboaf], title: "Titre du talk" },
      { conference, speakers: [carbonnel], title: "Titre du talk" },
    ]);
  });

  it("leaves an already-titled speak untouched", () => {
    const pageText = "Emmanuelle Aboaf Manon Carbonnel";
    const speaks = [
      { conference, speakers: [aboaf], title: "Already set" },
      { conference, speakers: [carbonnel], title: "Its own title" },
    ];

    expect(fillMissingCoPresenterTitles(speaks, pageText)).toEqual(speaks);
  });

  it("does not propagate a title from a speaker far away in the text", () => {
    const pageText = "Emmanuelle Aboaf a parlé de X" + " mot".repeat(100) + " Someone Else a parlé de Y";
    const speaks = [
      { conference, speakers: [aboaf], title: "Titre X" },
      { conference, speakers: [other], title: null },
    ];

    expect(fillMissingCoPresenterTitles(speaks, pageText)).toEqual(speaks);
  });

  it("leaves a null title as-is when no nearby titled co-presenter exists", () => {
    const pageText = "Emmanuelle Aboaf seule sur scène";
    const speaks = [{ conference, speakers: [aboaf], title: null }];

    expect(fillMissingCoPresenterTitles(speaks, pageText)).toEqual(speaks);
  });
});
