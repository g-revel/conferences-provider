import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";
import { stripHtml } from "../../html.functions.js";

const ANCHOR_PATTERN = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

// Certains sites (ex. mixitconf.org) ont une page dédiée par speaker, liée depuis
// le programme (ex. <a href="/speakers/julien.topcu">Julien Topçu</a>) — bien plus
// fiable pour le titre qu'une fenêtre de texte dans la page programme (page courte,
// entièrement consacrée à cette personne). Opère sur le HTML brut : les hrefs
// disparaissent après stripHtml. Le nom peut être dans du texte imbriqué (observé sur
// touraine.tech : <a href="/speaker/Nathan_Castelein"><div><h3>Nathan Castelein</h3>
// </div></a>, pas un texte d'ancre direct) — on extrait tout le texte du bloc
// (stripHtml retire les balises imbriquées), pas seulement le texte avant la 1ère balise.
export function findSpeakerProfileLinks(html: string, candidates: Speaker[]): Map<Speaker, string> {
  const hrefByName = new Map<string, string>();
  for (const match of html.matchAll(ANCHOR_PATTERN)) {
    const [, href, innerHtml] = match;
    const name = normalizeForMatch(stripHtml(innerHtml));
    if (name && !hrefByName.has(name)) hrefByName.set(name, href);
  }

  const result = new Map<Speaker, string>();
  for (const speaker of candidates) {
    const href = hrefByName.get(normalizeForMatch(`${speaker.firstname} ${speaker.lastname}`));
    if (href) result.set(speaker, href);
  }
  return result;
}
