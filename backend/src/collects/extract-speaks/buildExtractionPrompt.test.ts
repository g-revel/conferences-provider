import { describe, it, expect } from "vitest";
import { buildExtractionPrompt } from "./buildExtractionPrompt.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" };
const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };

describe("buildExtractionPrompt", () => {
  it("includes each speaker's full name", () => {
    const { user } = buildExtractionPrompt([
      { speaker: alice, context: "ctx alice" },
      { speaker: bob, context: "ctx bob" },
    ]);
    expect(user).toContain("Alice Martin");
    expect(user).toContain("Bob Dupont");
  });

  it("includes each speaker's context window", () => {
    const { user } = buildExtractionPrompt([{ speaker: alice, context: "Intro TDD par Alice Martin" }]);
    expect(user).toContain("Intro TDD par Alice Martin");
  });

  it("instructs the model to only return title: null when genuinely absent", () => {
    const { system } = buildExtractionPrompt([]);
    expect(system).toMatch(/title: null/);
  });
});
