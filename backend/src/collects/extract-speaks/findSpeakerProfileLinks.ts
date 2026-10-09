import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";
import { decodeHtmlEntities } from "../../html.functions.js";

const ANCHOR_PATTERN = /<a\s[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g;

// Certains sites (ex. mixitconf.org) ont une page dédiée par speaker, liée depuis
// le programme (ex. <a href="/speakers/julien.topcu">Julien Topçu</a>) — bien plus
// fiable pour le titre qu'une fenêtre de texte dans la page programme (page courte,
// entièrement consacrée à cette personne). Opère sur le HTML brut : les hrefs
// disparaissent après stripHtml.
export function findSpeakerProfileLinks(html: string, candidates: Speaker[]): Map<Speaker, string> {
  const hrefByName = new Map<string, string>();
  for (const match of html.matchAll(ANCHOR_PATTERN)) {
    const [, href, text] = match;
    const name = normalizeForMatch(decodeHtmlEntities(text));
    if (!hrefByName.has(name)) hrefByName.set(name, href);
  }

  const result = new Map<Speaker, string>();
  for (const speaker of candidates) {
    const href = hrefByName.get(normalizeForMatch(`${speaker.firstname} ${speaker.lastname}`));
    if (href) result.set(speaker, href);
  }
  return result;
}
