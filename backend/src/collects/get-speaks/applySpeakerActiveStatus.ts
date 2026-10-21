import { Speak } from "./speak.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// speakers.json est la source de vérité pour `active` dérivé de Slack (mergeSpeakers.ts
// le garde à jour, additif, jamais de suppression). Un admin peut cependant surcharger
// cette valeur manuellement (ex. membre parti sans que son compte Slack soit désactivé) —
// voir applyMemberOverrides.ts, appliqué après celui-ci pour gagner sur cette valeur.
// Un speaker absent de speakers.json (talk importé depuis Notion sans contrepartie
// Slack) reste `active` par défaut plutôt que d'être supposé parti.
export function applySpeakerActiveStatus(speaks: Speak[], speakers: Speaker[]): Speak[] {
  const activeByIdentity = new Map(
    speakers.map((speaker) => [speakerIdentity(speaker.firstname, speaker.lastname), speaker.active]),
  );

  return speaks.map((speak) => ({
    ...speak,
    speakers: speak.speakers.map((speaker) => {
      const active = activeByIdentity.get(speakerIdentity(speaker.firstname, speaker.lastname));
      if (active === undefined) return speaker;
      return { ...speaker, active };
    }),
  }));
}
