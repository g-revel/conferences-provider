import { describe, it, expect } from "vitest";
import { applySpeakerActiveStatus } from "./applySpeakerActiveStatus.js";
import type { Speak } from "./speak.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const castelein = { firstname: "Nathan", lastname: "Castelein", company: "Shodo Lille" };
const conference = { name: "MixIT" };

function speak(speakers: typeof topcu[]): Speak {
  return { id: "1", conference, speakers, title: "Un talk" };
}

describe("applySpeakerActiveStatus", () => {
  it("marks a speaker inactive when speakers.json says they left", () => {
    const result = applySpeakerActiveStatus(
      [speak([topcu])],
      [{ ...topcu, active: false }],
    );

    expect(result[0].speakers[0].active).toBe(false);
  });

  it("matches regardless of case or accents", () => {
    const result = applySpeakerActiveStatus(
      [speak([topcu])],
      [{ firstname: "julien", lastname: "TOPCU", company: "Shodo", active: false }],
    );

    expect(result[0].speakers[0].active).toBe(false);
  });

  it("leaves a speaker untouched when absent from speakers.json", () => {
    const result = applySpeakerActiveStatus([speak([topcu])], []);

    expect(result[0].speakers[0]).toEqual(topcu);
    expect(result[0].speakers[0]).not.toHaveProperty("active");
  });

  it("applies the status to only the matching speaker in a co-presented talk", () => {
    const result = applySpeakerActiveStatus(
      [speak([topcu, castelein])],
      [{ ...castelein, active: false }],
    );

    expect(result[0].speakers[0]).toEqual(topcu);
    expect(result[0].speakers[1].active).toBe(false);
  });

  it("does not mutate the input talks", () => {
    const original = speak([topcu]);
    applySpeakerActiveStatus([original], [{ ...topcu, active: false }]);

    expect(original.speakers[0]).toEqual(topcu);
  });
});
