import { and, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { conferences, speakers, talkSpeakers, talks } from "./schema.js";
import { Speak } from "../collects/get-speaks/speak.js";
import { normalizeForMatch } from "../string.functions.js";

// Jointure normalisée (décidé) : chaque speaker embarqué reflète ses infos
// ACTUELLES (company/city/active), pas une copie figée au moment de
// l'extraction comme dans talks.json — tout comme `conference` reflète l'URL
// actuelle de la conférence plutôt qu'une copie, puisque `talks.conference_name`
// est une FK, pas un snapshot.
export async function readTalks(): Promise<Speak[]> {
  const rows = await db
    .select({ talk: talks, conference: conferences, speaker: speakers })
    .from(talks)
    .innerJoin(conferences, eq(conferences.name, talks.conferenceName))
    .leftJoin(talkSpeakers, eq(talkSpeakers.talkId, talks.id))
    .leftJoin(speakers, eq(speakers.id, talkSpeakers.speakerId));

  const byId = new Map<string, Speak>();
  for (const row of rows) {
    let speak = byId.get(row.talk.id);
    if (!speak) {
      speak = {
        id: row.talk.id,
        conference: {
          name: row.conference.name,
          url: row.conference.url,
          pastEditionUrls: row.conference.pastEditionUrls,
        },
        speakers: [],
        title: row.talk.title,
        videoUrl: row.talk.videoUrl,
        categories: row.talk.categories,
        format: row.talk.format,
        level: row.talk.level,
        language: row.talk.language,
        slidesUrl: row.talk.slidesUrl,
        description: row.talk.description,
        year: row.talk.year,
        deletedAt: row.talk.deletedAt?.toISOString() ?? null,
        pendingVideoUrl: row.talk.pendingVideoUrl,
        showWithoutLink: row.talk.showWithoutLink,
        showWithoutYear: row.talk.showWithoutYear,
        status: row.talk.status ?? undefined,
        validated: row.talk.validated,
      };
      byId.set(row.talk.id, speak);
    }
    if (row.speaker) {
      speak.speakers.push({
        firstname: row.speaker.firstname,
        lastname: row.speaker.lastname,
        company: row.speaker.company,
        city: row.speaker.city,
        active: row.speaker.active,
      });
    }
  }
  return [...byId.values()];
}

// Upsert par `id` (déjà assigné une seule fois par mergeSpeaks.ts côté appelant) ;
// `talk_speakers` reste insert-only (jamais de delete, mergeSpeaks.ts est
// purement additif) ; l'upsert défensif du speaker embarqué est `DO NOTHING`,
// jamais `DO UPDATE` — company/city/active restent la propriété exclusive de
// speakersStore.writeSpeakers(), un talk ré-sauvegardé avec une copie obsolète
// ne doit jamais les écraser en base.
export async function writeTalks(values: Speak[]): Promise<void> {
  if (values.length === 0) return;
  await db.transaction(async (tx) => {
    for (const talk of values) {
      const id = talk.id ?? crypto.randomUUID();
      const normalizedTitle = talk.title != null ? normalizeForMatch(talk.title) : null;

      await tx
        .insert(talks)
        .values({
          id,
          conferenceName: talk.conference.name,
          title: talk.title ?? null,
          normalizedTitle,
          videoUrl: talk.videoUrl ?? null,
          categories: talk.categories ?? [],
          format: talk.format ?? null,
          level: talk.level ?? null,
          language: talk.language ?? null,
          slidesUrl: talk.slidesUrl ?? null,
          description: talk.description ?? null,
          year: talk.year ?? null,
          deletedAt: talk.deletedAt != null ? new Date(talk.deletedAt) : null,
          pendingVideoUrl: talk.pendingVideoUrl ?? null,
          showWithoutLink: talk.showWithoutLink ?? false,
          showWithoutYear: talk.showWithoutYear ?? false,
          status: talk.status ?? null,
          validated: talk.validated ?? false,
        })
        .onConflictDoUpdate({
          target: talks.id,
          set: {
            conferenceName: sql`excluded.conference_name`,
            title: sql`excluded.title`,
            normalizedTitle: sql`excluded.normalized_title`,
            videoUrl: sql`excluded.video_url`,
            categories: sql`excluded.categories`,
            format: sql`excluded.format`,
            level: sql`excluded.level`,
            language: sql`excluded.language`,
            slidesUrl: sql`excluded.slides_url`,
            description: sql`excluded.description`,
            year: sql`excluded.year`,
            deletedAt: sql`excluded.deleted_at`,
            pendingVideoUrl: sql`excluded.pending_video_url`,
            showWithoutLink: sql`excluded.show_without_link`,
            showWithoutYear: sql`excluded.show_without_year`,
            status: sql`excluded.status`,
            validated: sql`excluded.validated`,
          },
        });

      for (const speaker of talk.speakers) {
        const normalizedFirstname = normalizeForMatch(speaker.firstname);
        const normalizedLastname = normalizeForMatch(speaker.lastname);

        await tx
          .insert(speakers)
          .values({
            firstname: speaker.firstname,
            lastname: speaker.lastname,
            normalizedFirstname,
            normalizedLastname,
            company: speaker.company,
            city: speaker.city ?? null,
            active: speaker.active ?? true,
          })
          .onConflictDoNothing({ target: [speakers.normalizedFirstname, speakers.normalizedLastname] });

        const [speakerRow] = await tx
          .select({ id: speakers.id })
          .from(speakers)
          .where(
            and(
              eq(speakers.normalizedFirstname, normalizedFirstname),
              eq(speakers.normalizedLastname, normalizedLastname),
            ),
          );

        await tx.insert(talkSpeakers).values({ talkId: id, speakerId: speakerRow.id }).onConflictDoNothing();
      }
    }
  });
}
