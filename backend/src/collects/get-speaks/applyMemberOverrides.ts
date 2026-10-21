import { Speak } from "./speak.js";
import { SpeakerMemberOverride } from "../get-all-speakers/speakerMemberOverride.js";
import { normalizeForMatch } from "../../string.functions.js";

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// Surcharge manuelle de `active`, appliquée après applySpeakerActiveStatus pour
// gagner sur la valeur dérivée de Slack : un admin peut marquer quelqu'un comme
// ayant quitté Shodo même si son compte Slack reste actif (ou l'inverse). Fichier
// séparé de speakers.json pour la même raison que speaker-city-overrides.json :
// speakers.json est régénéré en entier par refresh:speakers et écraserait sinon
// silencieusement cette édition manuelle au run suivant.
export function applyMemberOverrides(speaks: Speak[], overrides: SpeakerMemberOverride[]): Speak[] {
  const overrideByIdentity = new Map(
    overrides.map((o) => [speakerIdentity(o.firstname, o.lastname), o.active]),
  );

  return speaks.map((speak) => ({
    ...speak,
    speakers: speak.speakers.map((speaker) => {
      const identity = speakerIdentity(speaker.firstname, speaker.lastname);
      if (!overrideByIdentity.has(identity)) return speaker;
      return { ...speaker, active: overrideByIdentity.get(identity) };
    }),
  }));
}
