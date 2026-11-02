import { boolean, integer, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const conferences = pgTable("conferences", {
  name: text("name").primaryKey(),
  url: text("url"),
  pastEditionUrls: text("past_edition_urls").array().notNull().default([]),
});

export const speakers = pgTable(
  "speakers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    firstname: text("firstname").notNull(),
    lastname: text("lastname").notNull(),
    // Forme normalisée (normalizeForMatch, insensible casse/accents) : seule clé
    // d'identité utilisée pour matcher un speaker lors d'un upsert, voir
    // string.functions.ts#speakerIdentityKey.
    normalizedFirstname: text("normalized_firstname").notNull(),
    normalizedLastname: text("normalized_lastname").notNull(),
    company: text("company").notNull(),
    city: text("city"),
    active: boolean("active").notNull().default(true),
  },
  (table) => [unique().on(table.normalizedFirstname, table.normalizedLastname)],
);

export const talks = pgTable(
  "talks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conferenceName: text("conference_name")
      .notNull()
      .references(() => conferences.name),
    title: text("title"),
    // Forme normalisée du titre, pour l'identité de merge (conferenceName +
    // normalizedTitle) — voir mergeSpeaks.ts. NULL <> NULL en Postgres : plusieurs
    // talks sans titre connu pour une même conférence restent possibles.
    normalizedTitle: text("normalized_title"),
    videoUrl: text("video_url"),
    categories: text("categories").array().notNull().default([]),
    format: text("format"),
    level: text("level"),
    language: text("language"),
    slidesUrl: text("slides_url"),
    description: text("description"),
    year: integer("year"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    pendingVideoUrl: text("pending_video_url"),
    showWithoutLink: boolean("show_without_link").notNull().default(false),
    showWithoutYear: boolean("show_without_year").notNull().default(false),
    status: text("status"),
    validated: boolean("validated").notNull().default(false),
  },
  (table) => [unique().on(table.conferenceName, table.normalizedTitle)],
);

export const talkSpeakers = pgTable(
  "talk_speakers",
  {
    talkId: uuid("talk_id")
      .notNull()
      .references(() => talks.id, { onDelete: "cascade" }),
    speakerId: integer("speaker_id")
      .notNull()
      .references(() => speakers.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.talkId, table.speakerId] })],
);

export const speakerCityOverrides = pgTable("speaker_city_overrides", {
  speakerId: integer("speaker_id")
    .primaryKey()
    .references(() => speakers.id, { onDelete: "cascade" }),
  city: text("city"),
});

export const speakerMemberOverrides = pgTable("speaker_member_overrides", {
  speakerId: integer("speaker_id")
    .primaryKey()
    .references(() => speakers.id, { onDelete: "cascade" }),
  active: boolean("active").notNull(),
});

export const knownCities = pgTable("known_cities", {
  city: text("city").primaryKey(),
});
