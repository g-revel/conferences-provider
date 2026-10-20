import { Speaker } from "../get-all-speakers/speaker.js";
import { YoutubeResult } from "../../youtube.functions.js";
import { normalizeForMatch, containsWholeWord } from "../../string.functions.js";
import { decodeHtmlEntities } from "../../html.functions.js";

// Filtre déterministe avant même d'appeler Ollama : sur un run réel ouvert aux ~220
// speakers, ~34% des talks "découverts" par classifyVideo (titre + nom de chaîne
// seulement, pas de transcript) se sont révélés faux — des vidéos de grosses
// chaînes génériques (Devoxx France, GDG France) explicitement créditées à
// quelqu'un d'autre dans le titre lui-même (ex. "Koin en action... (Arnaud
// Giuliani)" classé à tort comme un talk de Mialy Rakotovao). Exiger le prénom ET
// le nom du speaker recherché (mot entier) dans le titre ou le nom de chaîne les
// élimine. Ne protège PAS contre un homonyme complet (ex. un autre "Cedric
// Varaire" sur une chaîne de jeu vidéo) : son nom y est bien littéralement présent
// — résiduel assumé, voir backend/CLAUDE.md.
export function mentionsSpeaker(video: YoutubeResult, speaker: Speaker): boolean {
  const haystack = normalizeForMatch(decodeHtmlEntities(`${video.title} ${video.author ?? ""}`));
  return (
    containsWholeWord(haystack, normalizeForMatch(speaker.firstname)) &&
    containsWholeWord(haystack, normalizeForMatch(speaker.lastname))
  );
}
