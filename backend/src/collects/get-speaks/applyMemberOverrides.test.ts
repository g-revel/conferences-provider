import { describe, it, expect } from "vitest";
import { applyMemberOverrides } from "./applyMemberOverrides.js";
import type { Speak } from "./speak.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const castelein = { firstname: "Nathan", lastname: "Castelein", company: "Shodo Lille" };
const conference = { name: "MixIT" };

function speak(speakers: typeof topcu[]): Speak {
  return { id: "1", conference, speakers, title: "Un talk" };
}

describe("applyMemberOverrides", () => {
  it("marks a speaker inactive when an admin override says so", () => {
    const result = applyMemberOverrides(
      [speak([topcu])],
      [{ firstname: "Julien", lastname: "Topcu", active: false }],
    );

    expect(result[0].speakers[0].active).toBe(false);
  });

  it("matches the override regardless of case or accents", () => {
    const result = applyMemberOverrides(
      [speak([topcu])],
      [{ firstname: "julien", lastname: "TOPCU", active: false }],
    );

    expect(result[0].speakers[0].active).toBe(false);
  });

  it("leaves a speaker without an override untouched", () => {
    const result = applyMemberOverrides([speak([topcu])], []);

    expect(result[0].speakers[0]).toEqual(topcu);
    expect(result[0].speakers[0]).not.toHaveProperty("active");
  });

  it("applies the override to only the matching speaker in a co-presented talk", () => {
    const result = applyMemberOverrides(
      [speak([topcu, castelein])],
      [{ firstname: "Nathan", lastname: "Castelein", active: false }],
    );

    expect(result[0].speakers[0]).toEqual(topcu);
    expect(result[0].speakers[1].active).toBe(false);
  });

  it("can win over an existing active value, in either direction", () => {
    const activeTopcu = { ...topcu, active: false };
    const result = applyMemberOverrides(
      [speak([activeTopcu])],
      [{ firstname: "Julien", lastname: "Topcu", active: true }],
    );

    expect(result[0].speakers[0].active).toBe(true);
  });

  it("does not mutate the input talks", () => {
    const original = speak([topcu]);
    applyMemberOverrides([original], [{ firstname: "Julien", lastname: "Topcu", active: false }]);

    expect(original.speakers[0]).toEqual(topcu);
  });
});
