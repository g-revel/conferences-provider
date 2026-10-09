import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch, containsWholeWord } from "../../string.functions.js";

// Déterministe, pas de LLM : évite de donner les 200+ speakers connus au modèle à
// chaque run (il tend alors à "réciter" la liste plutôt qu'analyser la page — observé
// en pratique) et évite un appel Ollama inutile quand personne de connu n'est sur la page.
export function findMentionedSpeakers(pageText: string, knownSpeakers: Speaker[]): Speaker[] {
  const normalizedPageText = normalizeForMatch(pageText);
  return knownSpeakers.filter(
    (speaker) =>
      containsWholeWord(normalizedPageText, normalizeForMatch(speaker.firstname)) &&
      containsWholeWord(normalizedPageText, normalizeForMatch(speaker.lastname)),
  );
}
