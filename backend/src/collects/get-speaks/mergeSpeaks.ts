import { Speak } from "./speak.js";

// `title` n'est volontairement pas dans la clé : un re-run qui affine l'extraction
// du titre doit corriger l'entrée existante, pas créer un doublon. Compromis : si
// un même speaker donne deux talks différents à la même conférence, seul le
// dernier trouvé est conservé (cas rare, non géré pour l'instant).
function identity(speak: Speak): string {
  return `${speak.conference.name}|${speak.speaker.firstname}|${speak.speaker.lastname}`;
}

// Additif uniquement : les talks déjà connus ne sont jamais supprimés, même si
// une page de conférence ne les mentionne plus lors d'un run ultérieur.
export function mergeSpeaks(existing: Speak[], found: Speak[]): Speak[] {
  const byIdentity = new Map(existing.map((speak) => [identity(speak), speak]));
  for (const speak of found) {
    byIdentity.set(identity(speak), speak);
  }
  return [...byIdentity.values()];
}
