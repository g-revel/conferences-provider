import { eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { conferences } from "./schema.js";
import { Conference } from "../collects/get-conferences/conference.js";

// Ne lit que le seed list curaté (is_seed) — exclut les conférences créées
// défensivement par talksStore.ts pour satisfaire la FK d'un talk Notion/YouTube
// référençant une conférence hors de la liste statique events.json.
export async function readConferences(): Promise<Conference[]> {
  const rows = await db.select().from(conferences).where(eq(conferences.isSeed, true));
  return rows.map((row) => ({
    name: row.name,
    url: row.url,
    pastEditionUrls: row.pastEditionUrls,
  }));
}

// Upsert par `name` (clé d'identité unique) — jamais de delete, cohérent avec
// updateEventUrls.ts qui ne fait qu'accumuler/patcher une liste statique. Marque
// toujours `isSeed: true` : une conférence passée ici vient par définition
// d'events.json, même si elle existait déjà comme ligne défensive (is_seed:
// false) créée par un talk.
export async function writeConferences(values: Conference[]): Promise<void> {
  if (values.length === 0) return;
  await db
    .insert(conferences)
    .values(
      values.map((conference) => ({
        name: conference.name,
        url: conference.url ?? null,
        pastEditionUrls: conference.pastEditionUrls ?? [],
        isSeed: true,
      })),
    )
    .onConflictDoUpdate({
      target: conferences.name,
      set: {
        url: sql`excluded.url`,
        pastEditionUrls: sql`excluded.past_edition_urls`,
        isSeed: sql`excluded.is_seed`,
      },
    });
}
