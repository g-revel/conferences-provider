import { SpeakerContext } from "./extractContextWindows.js";

export interface ExtractionPrompt {
  system: string;
  user: string;
}

// On ne donne au modèle que les personnes déjà confirmées présentes sur la page
// (findMentionedSpeakers, déterministe) et un extrait de texte autour de chaque nom,
// pas la liste complète des speakers connus ni la page entière — un prompt plus
// large pousse le modèle à "réciter" la liste fournie au lieu d'analyser le texte.
export function buildExtractionPrompt(contexts: SpeakerContext[]): ExtractionPrompt {
  const sections = contexts
    .map(({ speaker, context }) => `--- ${speaker.firstname} ${speaker.lastname} ---\n${context}`)
    .join("\n\n");

  return {
    system:
      "Tu analyses des extraits de texte d'une page de programme de conférence tech. " +
      "On sait déjà que chaque personne listée ci-dessous est mentionnée sur la page : " +
      "ta seule tâche est de retrouver l'intitulé du talk qu'elle donne, à partir du texte fourni pour elle. " +
      "Tu réponds UNIQUEMENT en JSON valide, au format " +
      '{ "matches": [{ "firstname": "...", "lastname": "...", "title": "..." }] }, ' +
      "une entrée par personne. `title` est l'intitulé exact tel qu'il apparaît dans le texte " +
      "(il peut être juste avant ou juste après le nom). " +
      "Attention : le texte peut lister plusieurs noms consécutifs (co-intervenants d'un même talk) juste avant " +
      "ou après un seul intitulé, par exemple \"INTITULÉ Nom1 Nom2\" ou \"Nom1 Nom2 INTITULÉ\" — dans les deux cas, " +
      "ce même intitulé s'applique à CHACUN des noms du groupe, même si la personne demandée n'est pas le nom " +
      "directement collé à l'intitulé (ex. dans \"INTITULÉ Nom1 Nom2\", Nom2 a le même intitulé que Nom1). " +
      "Mets `title: null` seulement si le texte fourni ne contient vraiment aucun intitulé de talk pour cette personne.",
    user: "Personnes et extraits de texte associés :\n\n" + sections,
  };
}
