import { describe, it, expect } from "vitest";
import { detectCoPresenters } from "./detectCoPresenters.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const pierrain = { firstname: "Thomas", lastname: "Pierrain", company: "Shodo" };
const castelein = { firstname: "Nathan", lastname: "Castelein", company: "Shodo Lille" };

describe("detectCoPresenters", () => {
  it("finds another known speaker mentioned alongside the primary one", () => {
    const title = "The Hive pattern: a modularization strategy (Julien Topçu & Thomas Pierrain) #MiXiT2025";

    expect(detectCoPresenters(title, topcu, [topcu, pierrain, castelein])).toEqual([pierrain]);
  });

  it("never includes the primary speaker itself", () => {
    const title = "Why Tech is More Pop Culture Than Engineering? (Julien Topçu)";

    expect(detectCoPresenters(title, topcu, [topcu, pierrain, castelein])).toEqual([]);
  });

  it("returns an empty array when no other known speaker is mentioned", () => {
    const title = "Some talk by an unrelated person";

    expect(detectCoPresenters(title, topcu, [topcu, pierrain, castelein])).toEqual([]);
  });

  it("requires both firstname and lastname to match", () => {
    const title = "A talk mentioning only Pierrain, a different Pierrain";

    expect(detectCoPresenters(title, topcu, [topcu, pierrain])).toEqual([]);
  });
});
