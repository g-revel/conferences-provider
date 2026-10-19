import { describe, it, expect } from "vitest";
import { applyCityOverrides } from "./applyCityOverrides.js";
import type { Speak } from "./speak.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const castelein = { firstname: "Nathan", lastname: "Castelein", company: "Shodo Lille" };
const conference = { name: "MixIT" };

function speak(speakers: typeof topcu[]): Speak {
  return { id: "1", conference, speakers, title: "Un talk" };
}

describe("applyCityOverrides", () => {
  it("sets the city on a speaker that has an override", () => {
    const result = applyCityOverrides([speak([topcu])], [{ firstname: "Julien", lastname: "Topcu", city: "Paris" }]);

    expect(result[0].speakers[0].city).toBe("Paris");
  });

  it("matches the override regardless of case or accents", () => {
    const result = applyCityOverrides([speak([topcu])], [{ firstname: "julien", lastname: "TOPCU", city: "Paris" }]);

    expect(result[0].speakers[0].city).toBe("Paris");
  });

  it("leaves a speaker without an override untouched", () => {
    const result = applyCityOverrides([speak([topcu])], []);

    expect(result[0].speakers[0]).toEqual(topcu);
    expect(result[0].speakers[0]).not.toHaveProperty("city");
  });

  it("applies the override to only the matching speaker in a co-presented talk", () => {
    const result = applyCityOverrides(
      [speak([topcu, castelein])],
      [{ firstname: "Nathan", lastname: "Castelein", city: "Lille" }],
    );

    expect(result[0].speakers[0]).toEqual(topcu);
    expect(result[0].speakers[1].city).toBe("Lille");
  });

  it("can clear an override by setting city to null", () => {
    const result = applyCityOverrides([speak([topcu])], [{ firstname: "Julien", lastname: "Topcu", city: null }]);

    expect(result[0].speakers[0].city).toBeNull();
  });

  it("does not mutate the input talks", () => {
    const original = speak([topcu]);
    applyCityOverrides([original], [{ firstname: "Julien", lastname: "Topcu", city: "Paris" }]);

    expect(original.speakers[0]).toEqual(topcu);
  });
});
