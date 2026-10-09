import { Speaker } from "../get-all-speakers/speaker.js";
import { YoutubeResult } from "../../youtube.functions.js";
import { normalizeForMatch, containsWholeWord } from "../../string.functions.js";
import { decodeHtmlEntities } from "../../html.functions.js";

// Vérification déterministe plutôt que de faire confiance au classement du
// moteur de recherche seul : on ne garde un résultat que si son titre contient
// (mot entier) le prénom ET le nom de famille d'au moins un des speakers du
// talk — même exigence que findMentionedSpeakers.ts côté extraction. Le seul
// nom de famille ne suffit pas : vérifié en pratique sur un faux positif réel
// ("Introduction Sécurité" de Guillaume Yan matché à une vidéo de "Yan
// Rolland", un homonyme sans rapport dont "Yan" est le prénom).
export function pickBestVideoMatch(results: YoutubeResult[], speakers: Speaker[]): string | null {
  for (const result of results) {
    const normalizedTitle = normalizeForMatch(decodeHtmlEntities(result.title));
    const matches = speakers.some(
      (speaker) =>
        containsWholeWord(normalizedTitle, normalizeForMatch(speaker.firstname)) &&
        containsWholeWord(normalizedTitle, normalizeForMatch(speaker.lastname)),
    );
    if (matches) return result.url;
  }
  return null;
}
