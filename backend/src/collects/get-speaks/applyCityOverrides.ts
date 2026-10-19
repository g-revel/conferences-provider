import { Speak } from "./speak.js";
import { SpeakerCityOverride } from "../get-all-speakers/speakerCityOverride.js";
import { normalizeForMatch } from "../../string.functions.js";

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`;
}

// Surcharge la ville assignée côté admin sur chaque speaker embarqué dans les talks —
// `speaker.city`, s'il est défini, prend le pas sur la dérivation depuis `company`
// (voir frontend/src/domain/speakers/SpeakerCity.ts : `speaker.city ?? extractCityFromCompany(...)`).
// N'écrase un speaker QUE s'il a effectivement un override (sinon objet inchangé, par
// référence — évite de recréer inutilement toute l'arborescence pour les cas sans override).
export function applyCityOverrides(speaks: Speak[], overrides: SpeakerCityOverride[]): Speak[] {
  const overrideByIdentity = new Map(
    overrides.map((o) => [speakerIdentity(o.firstname, o.lastname), o.city]),
  );

  return speaks.map((speak) => ({
    ...speak,
    speakers: speak.speakers.map((speaker) => {
      const identity = speakerIdentity(speaker.firstname, speaker.lastname);
      if (!overrideByIdentity.has(identity)) return speaker;
      return { ...speaker, city: overrideByIdentity.get(identity) };
    }),
  }));
}
