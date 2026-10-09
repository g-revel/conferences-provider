import { Speaker } from "../get-all-speakers/speaker.js";

export interface SpeakerContext {
  speaker: Speaker;
  context: string;
}

const DEFAULT_WINDOW_CHARS = 400;

// Le titre d'un talk peut apparaître avant OU après le nom selon le site (observé :
// "avant" sur breizhcamp.org, "après" sur mixitconf.org et rivieradev.fr). Plutôt que
// de tronquer toute la page (perd des titres éloignés du début) ou de l'envoyer en
// entier (coûteux, dilue le signal), on isole une fenêtre de texte autour de chaque
// occurrence du nom de famille — assez pour contenir le titre des deux côtés.
export function extractContextWindows(
  pageText: string,
  speakers: Speaker[],
  windowChars: number = DEFAULT_WINDOW_CHARS,
): SpeakerContext[] {
  return speakers.map((speaker) => {
    const idx = pageText.toLowerCase().indexOf(speaker.lastname.toLowerCase());
    if (idx === -1) {
      return { speaker, context: "" };
    }
    const start = Math.max(0, idx - windowChars);
    const end = Math.min(pageText.length, idx + speaker.lastname.length + windowChars);
    return { speaker, context: pageText.slice(start, end) };
  });
}
