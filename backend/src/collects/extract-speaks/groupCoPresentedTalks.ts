import { Speak } from "../get-speaks/speak.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";

function speakerIdentity(speaker: Speaker): string {
  return `${normalizeForMatch(speaker.firstname)}|${normalizeForMatch(speaker.lastname)}`;
}

// Deux entrées de la même conférence partageant le même intitulé (non-null) sont
// le même talk co-animé : on les fusionne en une seule entrée multi-speakers
// plutôt que de garder un doublon par intervenant. Un titre `null` n'est jamais
// utilisé comme clé de regroupement — impossible de savoir si deux talks sans
// titre connu sont le même talk ou deux talks distincts.
export function groupCoPresentedTalks(speaks: Speak[]): Speak[] {
  const grouped: Speak[] = [];
  const indexByKey = new Map<string, number>();

  for (const speak of speaks) {
    if (speak.title == null) {
      grouped.push(speak);
      continue;
    }

    const key = `${speak.conference.name}|${normalizeForMatch(speak.title)}`;
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, grouped.length);
      grouped.push(speak);
      continue;
    }

    const existing = grouped[existingIndex];
    const knownIdentities = new Set(existing.speakers.map(speakerIdentity));
    const newSpeakers = speak.speakers.filter((s) => !knownIdentities.has(speakerIdentity(s)));
    if (newSpeakers.length > 0) {
      grouped[existingIndex] = { ...existing, speakers: [...existing.speakers, ...newSpeakers] };
    }
  }

  return grouped;
}
