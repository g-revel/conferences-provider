import { and, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { speakerCityOverrides, speakers } from "./schema.js";
import { SpeakerCityOverride } from "../collects/get-all-speakers/speakerCityOverride.js";
import { normalizeForMatch } from "../string.functions.js";

export async function readSpeakerCityOverrides(): Promise<SpeakerCityOverride[]> {
  const rows = await db
    .select({ firstname: speakers.firstname, lastname: speakers.lastname, city: speakerCityOverrides.city })
    .from(speakerCityOverrides)
    .innerJoin(speakers, eq(speakers.id, speakerCityOverrides.speakerId));
  return rows;
}

// Résout firstname/lastname -> speaker_id par identité normalisée, puis upsert
// par speaker_id. Le speaker doit déjà exister (créé par speakersStore ou
// talksStore) — une surcharge ciblant un speaker inconnu est une incohérence de
// données, pas un cas à absorber silencieusement.
export async function writeSpeakerCityOverrides(values: SpeakerCityOverride[]): Promise<void> {
  for (const override of values) {
    const normalizedFirstname = normalizeForMatch(override.firstname);
    const normalizedLastname = normalizeForMatch(override.lastname);
    const [speaker] = await db
      .select({ id: speakers.id })
      .from(speakers)
      .where(
        and(eq(speakers.normalizedFirstname, normalizedFirstname), eq(speakers.normalizedLastname, normalizedLastname)),
      );
    if (!speaker) {
      throw new Error(`speaker-city-override: aucun speaker trouvé pour ${override.firstname} ${override.lastname}`);
    }

    await db
      .insert(speakerCityOverrides)
      .values({ speakerId: speaker.id, city: override.city })
      .onConflictDoUpdate({ target: speakerCityOverrides.speakerId, set: { city: sql`excluded.city` } });
  }
}
