import { describe, it, expect } from "vitest";
import { toPascalCase, normalizeForMatch, containsWholeWord } from "./string.functions.js";

describe("toPascalCase", () => {
  it("capitalizes a single lowercase word", () => {
    expect(toPascalCase("hello")).toBe("Hello");
  });

  it("normalizes a single uppercase word", () => {
    expect(toPascalCase("HELLO")).toBe("Hello");
  });

  it("capitalizes each word separated by a single space", () => {
    expect(toPascalCase("hello world")).toBe("Hello World");
  });

  it("normalizes each word independently regardless of its original case", () => {
    expect(toPascalCase("hELLo WoRLD")).toBe("Hello World");
  });

  it("returns an empty string unchanged", () => {
    expect(toPascalCase("")).toBe("");
  });

  it("preserves empty words produced by multiple consecutive spaces", () => {
    expect(toPascalCase("a  b")).toBe("A  B");
  });

  it("capitalizes a single character", () => {
    expect(toPascalCase("a")).toBe("A");
  });
});

describe("normalizeForMatch", () => {
  it("ignores case", () => {
    expect(normalizeForMatch("Alice")).toBe(normalizeForMatch("alice"));
  });

  it("ignores accents", () => {
    expect(normalizeForMatch("Hélène")).toBe(normalizeForMatch("Helene"));
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeForMatch("  Alice  ")).toBe("alice");
  });
});

describe("containsWholeWord", () => {
  it("finds a word surrounded by other words", () => {
    expect(containsWholeWord("il faut avoir confiance", "avoir")).toBe(true);
  });

  it("does not match a word that only appears as a substring of another word", () => {
    expect(containsWholeWord("il faut avoir confiance", "vo")).toBe(false);
  });

  it("returns false for an empty word", () => {
    expect(containsWholeWord("il faut avoir confiance", "")).toBe(false);
  });

  it("does not crash on regex special characters", () => {
    expect(containsWholeWord("v-vignon est la", "v-vignon")).toBe(true);
  });
});
