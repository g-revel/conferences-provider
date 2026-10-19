import { Speak } from "./speak.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";

function speakerIdentity(speaker: Speaker): string {
  return `${normalizeForMatch(speaker.firstname)}|${normalizeForMatch(speaker.lastname)}`;
}

function titleKey(conferenceName: string, title: string): string {
  return `${conferenceName}|${normalizeForMatch(title)}`;
}

function speakerKey(conferenceName: string, speaker: Speaker): string {
  return `${conferenceName}|${speakerIdentity(speaker)}`;
}

// Additif uniquement : les talks déjà connus ne sont jamais supprimés, même si
// une page de conférence ne les mentionne plus lors d'un run ultérieur. Un talk
// co-animé est une seule entrée multi-speakers (groupCoPresentedTalks) ; `title`
// n'identifie un talk qu'une fois non-null — tant qu'aucun titre n'est connu,
// chaque speaker reste une entrée séparée (on ne peut pas savoir si deux talks
// sans titre sont le même talk). Un re-run qui découvre enfin le titre d'un
// speaker jusque-là sans titre doit remplacer son entrée null, pas en ajouter
// une nouvelle à côté.
export function mergeSpeaks(existing: Speak[], found: Speak[]): Speak[] {
  const titledByKey = new Map<string, Speak>();
  const nullTitledBySpeakerKey = new Map<string, Speak>();

  function isAlreadyTitled(conferenceName: string, speaker: Speaker): boolean {
    for (const speak of titledByKey.values()) {
      if (speak.conference.name !== conferenceName) continue;
      if (speak.speakers.some((s) => speakerIdentity(s) === speakerIdentity(speaker))) return true;
    }
    return false;
  }

  function ingest(speak: Speak): void {
    if (speak.title != null) {
      const key = titleKey(speak.conference.name, speak.title);
      const current = titledByKey.get(key);
      if (!current) {
        titledByKey.set(key, speak);
      } else {
        const known = new Set(current.speakers.map(speakerIdentity));
        const newSpeakers = speak.speakers.filter((s) => !known.has(speakerIdentity(s)));
        if (newSpeakers.length > 0) {
          titledByKey.set(key, { ...current, speakers: [...current.speakers, ...newSpeakers] });
        }
      }
      for (const speaker of speak.speakers) {
        nullTitledBySpeakerKey.delete(speakerKey(speak.conference.name, speaker));
      }
      return;
    }

    const speaker = speak.speakers[0];
    if (isAlreadyTitled(speak.conference.name, speaker)) return; // titre déjà trouvé ailleurs : cette entrée null est obsolète

    const key = speakerKey(speak.conference.name, speaker);
    if (!nullTitledBySpeakerKey.has(key)) {
      nullTitledBySpeakerKey.set(key, speak);
    }
  }

  for (const speak of existing) ingest(speak);
  for (const speak of found) ingest(speak);

  // Un id stable par talk est nécessaire pour cibler une suppression/restauration
  // côté admin — assigné ici une seule fois, pas dans chaque collect, pour couvrir
  // tous les points d'entrée (extraction de site, découverte YouTube, import Notion...)
  // qui finissent tous par passer par ce merge avant d'être persistés.
  return [...titledByKey.values(), ...nullTitledBySpeakerKey.values()].map((speak) => ({
    ...speak,
    id: speak.id ?? crypto.randomUUID(),
  }));
}
