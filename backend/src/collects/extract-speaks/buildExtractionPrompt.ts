import { Speaker } from "../get-all-speakers/speaker.js";

const MAX_PAGE_TEXT_CHARS = 15000;

export interface ExtractionPrompt {
  system: string;
  user: string;
}

export function buildExtractionPrompt(pageText: string, speakers: Speaker[]): ExtractionPrompt {
  const truncatedPageText = pageText.slice(0, MAX_PAGE_TEXT_CHARS);
  const speakerList = speakers.map((s) => `${s.firstname} ${s.lastname}`).join("\n");

  return {
    system:
      "Tu analyses le texte d'une page web de conférence tech pour repérer des intervenants connus. " +
      "Tu réponds UNIQUEMENT en JSON valide, au format " +
      '{ "matches": [{ "firstname": "...", "lastname": "...", "title": "..." }] }. ' +
      "Ne mentionne JAMAIS une personne qui n'est pas dans la liste fournie ci-dessous — " +
      "si aucune des personnes de la liste n'apparaît sur la page, renvoie { \"matches\": [] }. " +
      "`title` est l'intitulé du talk donné par cette personne : sur ce type de page, le titre apparaît " +
      "juste avant ou juste après le nom dans le texte (horaire, titre, puis nom du ou des intervenants). " +
      "Ne renvoie `title: null` que si tu es certain qu'aucun titre n'est associé à cette personne.",
    user:
      "Liste des personnes à rechercher :\n" +
      speakerList +
      "\n\nTexte de la page :\n" +
      truncatedPageText,
  };
}
