import { describe, it, expect } from "vitest";
import { extractContextWindows } from "./extractContextWindows.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" };

describe("extractContextWindows", () => {
  it("includes text both before and after the name", () => {
    const pageText = "AVANT ".repeat(100) + "Alice Martin" + " APRES".repeat(100);
    const [{ context }] = extractContextWindows(pageText, [alice], 50);

    expect(context).toContain("AVANT");
    expect(context).toContain("Alice Martin");
    expect(context).toContain("APRES");
  });

  it("does not run past the start or end of the page", () => {
    const pageText = "Alice Martin";
    const [{ context }] = extractContextWindows(pageText, [alice], 400);

    expect(context).toBe("Alice Martin");
  });

  it("returns an empty context when the name is absent", () => {
    const [{ context }] = extractContextWindows("rien ici", [alice]);
    expect(context).toBe("");
  });

  it("returns one entry per speaker, in order", () => {
    const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };
    const contexts = extractContextWindows("Alice Martin ... Bob Dupont", [alice, bob]);

    expect(contexts.map((c) => c.speaker)).toEqual([alice, bob]);
  });
});
