import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { normalizeForMatch, containsWholeWord } from "../../string.functions.js";
import { decodeHtmlEntities } from "../../html.functions.js";

interface RawMatch {
  firstname?: unknown;
  lastname?: unknown;
  title?: unknown;
}

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// Le modèle sur-échappe parfois la ponctuation au lieu de recopier le caractère
// réel : séquence \uXXXX littérale (ex. "l\\u0027architecture") que JSON.parse
// laisse telle quelle puisque c'est un JSON valide, pas un \uXXXX à décoder, ou
// entité HTML littérale (ex. "l&#39;architecture") recopiée depuis la page source.
function sanitizeTitle(title: string): string {
  const withoutUnicodeEscapes = title.replace(
    /\\u([0-9a-fA-F]{4})/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );
  return decodeHtmlEntities(withoutUnicodeEscapes);
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

    const title = typeof match.title === "string" ? sanitizeTitle(match.title) : null;
    const existing = speaksByIdentity.get(identity);
    if (!existing || (existing.title == null && title != null)) {
      speaksByIdentity.set(identity, { conference, speakers: [speaker], title });
    }
  }
  return [...speaksByIdentity.values()];
}
