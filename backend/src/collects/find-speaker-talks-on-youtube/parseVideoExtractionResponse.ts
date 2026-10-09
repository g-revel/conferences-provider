import { sanitizeLlmText } from "../../html.functions.js";

export interface VideoExtraction {
  conferenceName: string;
  title: string;
}

interface RawExtraction {
  isConferenceTalk?: unknown;
  conferenceName?: unknown;
  title?: unknown;
}

// Garde-fou anti-hallucination : on ne retient une vidéo que si le modèle est
// explicite (isConferenceTalk === true) ET fournit les deux champs attendus.
// Pas de vérification déterministe possible ici contrairement à l'extraction
// à partir d'une page connue (pas de "texte source" à comparer) — le risque
// résiduel de faux positif est assumé, atténué par isLikelyFullTalk en amont.
export function parseVideoExtractionResponse(rawJson: string): VideoExtraction | null {
  let parsed: RawExtraction;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  if (parsed.isConferenceTalk !== true) return null;
  if (typeof parsed.conferenceName !== "string" || typeof parsed.title !== "string") return null;

  const conferenceName = sanitizeLlmText(parsed.conferenceName).trim();
  const title = sanitizeLlmText(parsed.title).trim();
  if (!conferenceName || !title) return null;

  return { conferenceName, title };
}
