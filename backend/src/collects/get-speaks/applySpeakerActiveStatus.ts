import { Speak } from "./speak.js";
import { Speaker } from "../get-all-speakers/speaker.js";
import { normalizeForMatch } from "../../string.functions.js";

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// speakers.json est la source de vérité pour `active` (mergeSpeakers.ts le garde à
// jour, additif, jamais de suppression) — contrairement à la ville, `active` n'a pas
// besoin d'un fichier d'override séparé : rien n'est édité manuellement par-dessus.
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
