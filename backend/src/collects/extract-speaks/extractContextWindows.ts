import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";

export interface SpeakerContext {
  speaker: Speaker;
  context: string;
}

const DEFAULT_WINDOW_CHARS = 400;

// Un nom peut apparaître plusieurs fois sur la page (observé sur touraine.tech : une
// fois dans une liste alphabétique "Nos speakers" sans aucun titre à proximité, une
// seconde fois dans le bloc programme avec le titre juste à côté) — borne le nombre
// d'occurrences prises en compte pour éviter un contexte qui explose sur un nom très
// fréquent (homonymes, mentions répétées sur plusieurs jours de programme).
const MAX_OCCURRENCES = 5;

// Le titre d'un talk peut apparaître avant OU après le nom selon le site (observé :
// "avant" sur breizhcamp.org, "après" sur mixitconf.org et rivieradev.fr). Plutôt que
// de tronquer toute la page (perd des titres éloignés du début) ou de l'envoyer en
// entier (coûteux, dilue le signal), on isole une fenêtre de texte autour de chaque
// occurrence du nom de famille — assez pour contenir le titre des deux côtés.
// normalizeForMatch (NFD + suppression des marques diacritiques + minuscule) préserve
// la longueur de la chaîne pour les caractères accentués latins courants (1 caractère
// de base + 1 marque combinante par caractère accentué, la marque est ensuite retirée)
// — les index trouvés dans le texte normalisé restent donc valides pour découper le
// texte original. Nécessaire : un nom stocké sans accent ("Topcu") ne matchait jamais
// son occurrence réelle sur la page ("Topçu") avec un simple `.toLowerCase().indexOf()`.
export function extractContextWindows(
  pageText: string,
  speakers: Speaker[],
  windowChars: number = DEFAULT_WINDOW_CHARS,
): SpeakerContext[] {
  const normalizedPageText = normalizeForMatch(pageText);

  return speakers.map((speaker) => {
    const normalizedLastname = normalizeForMatch(speaker.lastname);
    const windows: string[] = [];
    let searchFrom = 0;
    while (windows.length < MAX_OCCURRENCES) {
      const idx = normalizedPageText.indexOf(normalizedLastname, searchFrom);
      if (idx === -1) break;
      const start = Math.max(0, idx - windowChars);
      const end = Math.min(pageText.length, idx + normalizedLastname.length + windowChars);
      windows.push(pageText.slice(start, end));
      searchFrom = idx + normalizedLastname.length;
    }
    return { speaker, context: windows.join("\n---\n") };
  });
}
