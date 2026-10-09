import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch, containsWholeWord } from "../../string.functions.js";
import { decodeHtmlEntities } from "../../html.functions.js";

function speakerIdentity(speaker: Speaker): string {
  return `${normalizeForMatch(speaker.firstname)}|${normalizeForMatch(speaker.lastname)}`;
}

// Repère, de façon déterministe (pas de LLM), les autres speakers Shodo connus
// cités dans le titre de la vidéo aux côtés du speaker recherché — ex. "Julien
// Topçu & Thomas Pierrain" dans un même titre. Permet de construire une entrée
// multi-speakers dès la découverte, sans dépendre entièrement de
// groupCoPresentedTalks (qui exige un titre de talk strictement identique).
export function detectCoPresenters(videoTitle: string, primarySpeaker: Speaker, knownSpeakers: Speaker[]): Speaker[] {
  const normalizedTitle = normalizeForMatch(decodeHtmlEntities(videoTitle));
  const primaryIdentity = speakerIdentity(primarySpeaker);

  return knownSpeakers.filter(
    (speaker) =>
      speakerIdentity(speaker) !== primaryIdentity &&
      containsWholeWord(normalizedTitle, normalizeForMatch(speaker.firstname)) &&
      containsWholeWord(normalizedTitle, normalizeForMatch(speaker.lastname)),
  );
}
