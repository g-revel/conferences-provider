import { describe, it, expect } from "vitest";
import { buildExtractionPrompt } from "./buildExtractionPrompt.js";

const speakers = [
  { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" },
  { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" },
];

describe("buildExtractionPrompt", () => {
  it("includes every known speaker's full name", () => {
    const { user } = buildExtractionPrompt("some page text", speakers);
    expect(user).toContain("Alice Martin");
    expect(user).toContain("Bob Dupont");
  });

  it("includes the page text", () => {
    const { user } = buildExtractionPrompt("Alice Martin will talk about TDD", speakers);
    expect(user).toContain("Alice Martin will talk about TDD");
  });

  it("truncates page text beyond the safety cap", () => {
    const longText = "a".repeat(20000);
    const { user } = buildExtractionPrompt(longText, speakers);
    expect(user.length).toBeLessThan(longText.length);
  });

  it("instructs the model not to invent names outside the list", () => {
    const { system } = buildExtractionPrompt("", speakers);
    expect(system).toMatch(/JAMAIS/);
  });
});
