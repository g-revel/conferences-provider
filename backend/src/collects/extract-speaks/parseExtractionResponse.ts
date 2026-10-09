import { Conference } from "../get-conferences/conference.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { Speak } from "../get-speaks/speak.js";
import { normalizeForMatch } from "../../string.functions.js";

interface RawMatch {
  firstname?: unknown;
  lastname?: unknown;
  title?: unknown;
}

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// `.includes()` seul est trop permissif sur un nom de famille court (ex. "Vo" matche
// à l'intérieur d'"avoir") : on exige une correspondance mot entier (`\b`), sur les
// deux noms — un nom de famille seul (même en mot entier) peut rester un homonyme
// courant, le prénom réduit nettement ce risque de faux positif.
function containsWholeWord(normalizedText: string, word: string): boolean {
  if (!word) return false;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(normalizedText);
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

  const speaks: Speak[] = [];
  for (const match of matches) {
    if (typeof match.firstname !== "string" || typeof match.lastname !== "string") continue;

    const speaker = speakersByIdentity.get(speakerIdentity(match.firstname, match.lastname));
    if (!speaker) continue; // nom hors de la liste fournie : on l'ignore (anti-hallucination)

    if (
      !containsWholeWord(normalizedPageText, normalizeForMatch(speaker.firstname)) ||
      !containsWholeWord(normalizedPageText, normalizeForMatch(speaker.lastname))
    ) continue; // prénom ou nom absent du texte réel

    speaks.push({
      conference,
      speaker,
      title: typeof match.title === "string" ? match.title : null,
    });
  }
  return speaks;
}
