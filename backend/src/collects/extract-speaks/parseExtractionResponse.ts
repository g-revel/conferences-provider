import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { normalizeForMatch, containsWholeWord } from "../../string.functions.js";
import { sanitizeLlmText } from "../../html.functions.js";

interface RawMatch {
  firstname?: unknown;
  lastname?: unknown;
  title?: unknown;
}

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// Calé empiriquement sur mixitconf.org : le titre réel le plus long observé fait
// 115 caractères ; le plus court fragment de description tronqué observé en fait 121
// ("(kata) de code simple où vous découvrirez..." — reste d'une description longue,
// capturé par la fenêtre de contexte programme quand ni la page profil ni l'extraction
// n'ont trouvé le vrai titre, nettement plus court). Si ce chiffre casse sur un titre
// légitime plus long, l'ajuster plutôt que le supprimer.
const MAX_TITLE_CHARS = 120;

// Garde-fous anti-hallucination supplémentaires (aucune vérification déterministe
// possible sur le contenu d'un titre, contrairement au nom d'un speaker) :
// - un hashtag de thème du site n'est jamais un titre de talk. Observé en pratique sur
//   touraine.tech, dont le header de CHAQUE page (y compris les pages profil speaker,
//   qui n'ont sinon qu'une bio sans aucun titre) affiche "Touraine Tech 2025 - <Nom>
//   #BackToSchool" — le modèle a confondu ce hashtag de thème annuel avec le titre.
// - un titre réel commence presque toujours par une majuscule (ou un caractère non
//   alphabétique) ; un fragment de phrase tronqué au milieu d'une description longue
//   commence par un mot en minuscule, parfois coupé en plein milieu de mot (ex. "re la
//   tête sur...", reste de "...vous prendre la tête"). Observé en pratique sur
//   mixitconf.org/2025 quand le modèle, sans titre net à extraire d'une description
//   de talk longue, en recopie un fragment au lieu de renvoyer `null`.
// - au-delà de MAX_TITLE_CHARS, même capitalisé, c'est presque certainement le même
//   type de fragment plutôt qu'un vrai titre (ex. "Moins de dette technique De
//   meilleures interactions avec vos collègues..." — liste à puces d'une description,
//   pas un intitulé de talk).
function isPlausibleTitle(title: string): boolean {
  const trimmed = title.trim();
  if (trimmed.startsWith("#")) return false;
  if (trimmed.length > MAX_TITLE_CHARS) return false;
  if (/^[a-zàâäéèêëïîôöùûüÿçœæ]/.test(trimmed)) return false;
  return true;
}

// La génération peut s'arrêter en plein milieu du JSON (num_predict atteint),
// ce qui casse JSON.parse sur la réponse entière. Comme chaque match est un objet
// plat sans accolade imbriquée, on peut récupérer les objets déjà complets avant
// la coupure plutôt que de tout perdre.
function parseMatches(rawJson: string): RawMatch[] {
  try {
    const parsed: { matches?: RawMatch[] } = JSON.parse(rawJson);
    return parsed.matches ?? [];
  } catch {
    const salvaged: RawMatch[] = [];
    for (const objectText of rawJson.match(/\{[^{}]*\}/g) ?? []) {
      try {
        salvaged.push(JSON.parse(objectText));
      } catch {
        // objet lui-même tronqué : on l'ignore
      }
    }
    return salvaged;
  }
}

// Deux garde-fous contre l'invention du modèle (observé en pratique : sur une page
// sans aucun speaker connu, le modèle peut "remplir" matches avec des noms piochés
// dans la liste fournie plutôt que de renvoyer une liste vide) :
// 1. le nom doit exister dans la liste des speakers connus (speakerIdentity) ;
// 2. prénom ET nom doivent apparaître comme mots entiers dans le texte de la page —
//    vérification déterministe, indépendante de ce que le modèle affirme.
export function parseExtractionResponse(
  rawJson: string,
  conference: Conference,
  knownSpeakers: Speaker[],
  pageText: string,
): Speak[] {
  const matches = parseMatches(rawJson);

  const speakersByIdentity = new Map(
    knownSpeakers.map((speaker) => [speakerIdentity(speaker.firstname, speaker.lastname), speaker]),
  );
  const normalizedPageText = normalizeForMatch(pageText);

  // Le modèle peut citer la même personne plusieurs fois dans une même réponse
  // (ex. une fois avec `title: null`, une fois avec le vrai titre, sur un talk à
  // plusieurs co-intervenants) — on dédoublonne en préférant un titre non-null,
  // plutôt que de dépendre de l'ordre d'apparition dans la réponse du modèle.
  const speaksByIdentity = new Map<string, Speak>();
  for (const match of matches) {
    if (typeof match.firstname !== "string" || typeof match.lastname !== "string") continue;

    const identity = speakerIdentity(match.firstname, match.lastname);
    const speaker = speakersByIdentity.get(identity);
    if (!speaker) continue; // nom hors de la liste fournie : on l'ignore (anti-hallucination)

    if (
      !containsWholeWord(normalizedPageText, normalizeForMatch(speaker.firstname)) ||
      !containsWholeWord(normalizedPageText, normalizeForMatch(speaker.lastname))
    ) continue; // prénom ou nom absent du texte réel

    const rawTitle = typeof match.title === "string" ? sanitizeLlmText(match.title) : null;
    const title = rawTitle != null && isPlausibleTitle(rawTitle) ? rawTitle : null;
    const existing = speaksByIdentity.get(identity);
    if (!existing || (existing.title == null && title != null)) {
      speaksByIdentity.set(identity, { conference, speakers: [speaker], title });
    }
  }
  return [...speaksByIdentity.values()];
}
