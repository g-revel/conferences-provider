import { and, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { speakerMemberOverrides, speakers } from "./schema.js";
import { SpeakerMemberOverride } from "../collects/get-all-speakers/speakerMemberOverride.js";
import { normalizeForMatch } from "../string.functions.js";

export async function readSpeakerMemberOverrides(): Promise<SpeakerMemberOverride[]> {
  const rows = await db
    .select({ firstname: speakers.firstname, lastname: speakers.lastname, active: speakerMemberOverrides.active })
    .from(speakerMemberOverrides)
    .innerJoin(speakers, eq(speakers.id, speakerMemberOverrides.speakerId));
  return rows;
}

// Même logique que speakerCityOverridesStore : résolution par identité
// normalisée, le speaker doit déjà exister.
export async function writeSpeakerMemberOverrides(values: SpeakerMemberOverride[]): Promise<void> {
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
      throw new Error(`speaker-member-override: aucun speaker trouvé pour ${override.firstname} ${override.lastname}`);
    }

    await db
      .insert(speakerMemberOverrides)
      .values({ speakerId: speaker.id, active: override.active })
      .onConflictDoUpdate({ target: speakerMemberOverrides.speakerId, set: { active: sql`excluded.active` } });
  }
}
