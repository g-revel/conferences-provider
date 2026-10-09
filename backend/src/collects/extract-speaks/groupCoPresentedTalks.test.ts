import { describe, it, expect } from "vitest";
import { groupCoPresentedTalks } from "./groupCoPresentedTalks.js";

const conference = { name: "BreizhCamp", url: "https://www.breizhcamp.org" };
const aboaf = { firstname: "Emmanuelle", lastname: "Aboaf", company: "Shodo" };
const carbonnel = { firstname: "Manon", lastname: "Carbonnel", company: "Shodo Rennes" };
const yan = { firstname: "Guillaume", lastname: "Yan", company: "Shodo Rennes" };

describe("groupCoPresentedTalks", () => {
  it("merges two entries sharing the same conference and title into one", () => {
    const speaks = [
      { conference, speakers: [aboaf], title: "Accessibilité" },
      { conference, speakers: [carbonnel], title: "Accessibilité" },
    ];

    expect(groupCoPresentedTalks(speaks)).toEqual([
      { conference, speakers: [aboaf, carbonnel], title: "Accessibilité" },
    ]);
  });

  it("matches the title regardless of case or accents", () => {
    const speaks = [
      { conference, speakers: [aboaf], title: "Accessibilité" },
      { conference, speakers: [carbonnel], title: "ACCESSIBILITE" },
    ];

    expect(groupCoPresentedTalks(speaks)).toEqual([
      { conference, speakers: [aboaf, carbonnel], title: "Accessibilité" },
    ]);
  });

  it("keeps distinct titles as separate entries", () => {
    const speaks = [
      { conference, speakers: [aboaf], title: "Accessibilité" },
      { conference, speakers: [yan], title: "Micronaut" },
    ];

    expect(groupCoPresentedTalks(speaks)).toEqual(speaks);
  });

  it("never groups entries with a null title", () => {
    const speaks = [
      { conference, speakers: [aboaf], title: null },
      { conference, speakers: [carbonnel], title: null },
    ];

    expect(groupCoPresentedTalks(speaks)).toEqual(speaks);
  });

  it("does not duplicate a speaker already present when merging again", () => {
    const speaks = [
      { conference, speakers: [aboaf, carbonnel], title: "Accessibilité" },
      { conference, speakers: [aboaf], title: "Accessibilité" },
    ];

    expect(groupCoPresentedTalks(speaks)).toEqual([
      { conference, speakers: [aboaf, carbonnel], title: "Accessibilité" },
    ]);
  });

  it("does not group the same title across different conferences", () => {
    const otherConference = { name: "MixIT", url: "https://mixitconf.org" };
    const speaks = [
      { conference, speakers: [aboaf], title: "Accessibilité" },
      { conference: otherConference, speakers: [carbonnel], title: "Accessibilité" },
    ];

    expect(groupCoPresentedTalks(speaks)).toEqual(speaks);
  });
});
