import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { speakers } from "./schema.js";
import { Speaker } from "../collects/get-all-speakers/speaker.js";
import { normalizeForMatch } from "../string.functions.js";

export async function readSpeakers(): Promise<Speaker[]> {
  const rows = await db.select().from(speakers);
  return rows.map((row) => ({
    firstname: row.firstname,
    lastname: row.lastname,
    company: row.company,
    city: row.city,
    active: row.active,
  }));
}

// Upsert par identité normalisée (normalizeForMatch, insensible casse/accents) —
// seule clé d'identité speaker en base, remplace la clé brute historique de
// mergeSpeakers.ts. `values` représente déjà l'état complet après fusion additive
// (mergeSpeakers.ts), donc un simple upsert-all suffit ici, pas de logique
// additive supplémentaire à ce niveau.
export async function writeSpeakers(values: Speaker[]): Promise<void> {
  if (values.length === 0) return;
  await db
    .insert(speakers)
    .values(
      values.map((speaker) => ({
        firstname: speaker.firstname,
        lastname: speaker.lastname,
        normalizedFirstname: normalizeForMatch(speaker.firstname),
        normalizedLastname: normalizeForMatch(speaker.lastname),
        company: speaker.company,
        city: speaker.city ?? null,
        active: speaker.active ?? true,
      })),
    )
    .onConflictDoUpdate({
      target: [speakers.normalizedFirstname, speakers.normalizedLastname],
      set: {
        firstname: sql`excluded.firstname`,
        lastname: sql`excluded.lastname`,
        company: sql`excluded.company`,
        city: sql`excluded.city`,
        active: sql`excluded.active`,
      },
    });
}
