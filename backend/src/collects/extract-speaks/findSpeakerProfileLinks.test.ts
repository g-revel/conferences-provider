import { describe, it, expect } from "vitest";
import { findSpeakerProfileLinks } from "./findSpeakerProfileLinks.js";

const topcu = { firstname: "Julien", lastname: "Topcu", company: "Shodo" };
const aboaf = { firstname: "Emmanuelle", lastname: "Aboaf", company: "Shodo" };

describe("findSpeakerProfileLinks", () => {
  it("finds the profile link for a candidate by matching the anchor text", () => {
    const html = '<a class="mxt-speakers__card" href="/speakers/julien.topcu">Julien Topçu</a>';

    const links = findSpeakerProfileLinks(html, [topcu]);

    expect(links.get(topcu)).toBe("/speakers/julien.topcu");
  });

  it("matches the name regardless of accents in the link text", () => {
    const html = '<a href="/speakers/emmanuelle-aboaf">Emmanuelle Aboaf</a>';

    expect(findSpeakerProfileLinks(html, [aboaf]).get(aboaf)).toBe("/speakers/emmanuelle-aboaf");
  });

  it("returns no entry for a candidate without a matching link", () => {
    const html = '<a href="/speakers/julien.topcu">Julien Topçu</a>';

    expect(findSpeakerProfileLinks(html, [aboaf]).has(aboaf)).toBe(false);
  });

  it("finds the profile link when the name is nested in child elements, not direct anchor text", () => {
    const castelein = { firstname: "Nathan", lastname: "Castelein", company: "Shodo Lille" };
    const html =
      '<a href="/speaker/Nathan_Castelein"><div class="speaker--bloc"><div class="container--image">' +
      '<img src="/_nuxt/img/x.png" alt="Nathan Castelein"></div> <h3>Nathan Castelein</h3></div></a>';

    expect(findSpeakerProfileLinks(html, [castelein]).get(castelein)).toBe("/speaker/Nathan_Castelein");
  });

  it("ignores links unrelated to any candidate", () => {
    const html = '<a href="/about">À propos</a><a href="/speakers/julien.topcu">Julien Topçu</a>';

    const links = findSpeakerProfileLinks(html, [topcu]);

    expect(links.size).toBe(1);
    expect(links.get(topcu)).toBe("/speakers/julien.topcu");
  });
});
