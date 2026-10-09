import { Speaker } from "../get-all-speakers/speaker.js";

export interface VideoExtractionPrompt {
  system: string;
  user: string;
}

export interface VideoInfo {
  title: string;
  author: string;
}

// Tâche volontairement bornée (un titre + un nom de chaîne à la fois, pas de
// transcript) — même esprit que buildExtractionPrompt.ts : narrow the LLM's job.
export function buildVideoExtractionPrompt(speaker: Speaker, video: VideoInfo): VideoExtractionPrompt {
  const system =
    "Tu analyses le titre et la chaîne YouTube d'une vidéo pour déterminer si c'est l'enregistrement d'un talk de conférence tech donné par une personne précise. " +
    'Tu réponds UNIQUEMENT en JSON valide, au format {"isConferenceTalk": boolean, "conferenceName": string|null, "title": string|null}. ' +
    "isConferenceTalk : true seulement si la vidéo est clairement l'enregistrement d'un talk de conférence donné par cette personne " +
    "(pas une interview, un trailer, un extrait, une vidéo d'une autre personne qui la mentionne). " +
    "conferenceName : le nom de l'événement/conférence, déduit du nom de la chaîne YouTube et/ou d'un indice dans le titre " +
    '(ex. un hashtag "#MiXiT2025" ou un suffixe "- NewCrafts 2025"). null si tu ne peux pas le déduire avec confiance. ' +
    "title : le titre du talk, nettoyé (sans les noms des intervenants entre parenthèses, sans hashtag de conférence). " +
    "null si isConferenceTalk est false ou si conferenceName est null.";

  const user = `Intervenant recherché : ${speaker.firstname} ${speaker.lastname}\nTitre de la vidéo : ${video.title}\nChaîne YouTube : ${video.author}`;

  return { system, user };
}
