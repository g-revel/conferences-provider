import { describe, it, expect } from "vitest";
import { findMentionedSpeakers } from "./findMentionedSpeakers.js";

const alice = { firstname: "Alice", lastname: "Martin", company: "Shodo Nantes" };
const bob = { firstname: "Bob", lastname: "Dupont", company: "Shodo Rennes" };
const vo = { firstname: "Jean", lastname: "Vo", company: "Shodo" };

describe("findMentionedSpeakers", () => {
  it("keeps a speaker whose full name is on the page", () => {
    expect(findMentionedSpeakers("9h00 Intro TDD par Alice Martin", [alice, bob])).toEqual([alice]);
  });

  it("drops a speaker absent from the page", () => {
    expect(findMentionedSpeakers("Rien ici", [alice, bob])).toEqual([]);
  });

  it("drops a short surname that only matches as a substring of another word", () => {
    expect(findMentionedSpeakers("Jean a raison, il faut avoir confiance", [vo])).toEqual([]);
  });

  it("is case and accent insensitive", () => {
    expect(findMentionedSpeakers("alice martin donnera un talk", [alice])).toEqual([alice]);
  });
});
