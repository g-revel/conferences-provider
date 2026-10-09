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

  it("includes a window around every occurrence of the name, not just the first", () => {
    const pageText = "Liste: Alice Martin, Bob. " + "x".repeat(100) + " Programme: TITRE Alice Martin FIN";
    const [{ context }] = extractContextWindows(pageText, [alice], 20);

    expect(context).toContain("Liste: Alice Martin");
    expect(context).toContain("TITRE Alice Martin FIN");
  });

  it("caps the number of occurrences considered", () => {
    const pageText = Array.from({ length: 10 }, (_, i) => `#${i} Alice Martin `).join("x".repeat(50));
    const [{ context }] = extractContextWindows(pageText, [alice], 10);

    expect(context.match(/Alice Martin/g)).toHaveLength(5);
  });

  it("finds the name even when the page spells it with an accent the stored lastname doesn't have", () => {
    const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
    const pageText = "AVANT " + "Julien Topçu" + " APRES";

    const [{ context }] = extractContextWindows(pageText, [topcu], 20);

    expect(context).toContain("AVANT");
    expect(context).toContain("Julien Topçu");
    expect(context).toContain("APRES");
  });

  it("returns one entry per speaker, in order", () => {
    const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };
    const contexts = extractContextWindows("Alice Martin ... Bob Dupont", [alice, bob]);

    expect(contexts.map((c) => c.speaker)).toEqual([alice, bob]);
  });
});
