import { describe, it, expect } from "vitest";
import { mergeSpeakers } from "./mergeSpeakers.js";

describe("mergeSpeakers", () => {
  it("adds a newly found speaker to the existing list", () => {
    const existing = [{ firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" }];
    const found = [{ firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" }];

    expect(mergeSpeakers(existing, found)).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" },
      { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" },
    ]);
  });

  it("refreshes company on an existing speaker matched by identity", () => {
    const existing = [{ firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" }];
    const found = [{ firstname: "Alice", lastname: "Martin", company: "Shodo Studio" }];

    expect(mergeSpeakers(existing, found)).toEqual([
      { firstname: "Alice", lastname: "Martin", company: "Shodo Studio" },
    ]);
  });

  it("keeps a speaker absent from the new Slack fetch", () => {
    const existing = [{ firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" }];

    expect(mergeSpeakers(existing, [])).toEqual(existing);
  });
});
