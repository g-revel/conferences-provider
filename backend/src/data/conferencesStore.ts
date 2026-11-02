import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { conferences } from "./schema.js";
import { Conference } from "../collects/get-conferences/conference.js";

export async function readConferences(): Promise<Conference[]> {
  const rows = await db.select().from(conferences);
  return rows.map((row) => ({
    name: row.name,
    url: row.url,
    pastEditionUrls: row.pastEditionUrls,
  }));
}

// Upsert par `name` (clé d'identité unique) — jamais de delete, cohérent avec
// updateEventUrls.ts qui ne fait qu'accumuler/patcher une liste statique.
export async function writeConferences(values: Conference[]): Promise<void> {
  if (values.length === 0) return;
  await db
    .insert(conferences)
    .values(
      values.map((conference) => ({
        name: conference.name,
        url: conference.url ?? null,
        pastEditionUrls: conference.pastEditionUrls ?? [],
      })),
    )
    .onConflictDoUpdate({
      target: conferences.name,
      set: {
        url: sql`excluded.url`,
        pastEditionUrls: sql`excluded.past_edition_urls`,
      },
    });
}
