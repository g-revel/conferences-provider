CREATE TABLE "conferences" (
	"name" text PRIMARY KEY NOT NULL,
	"url" text,
	"past_edition_urls" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "known_cities" (
	"city" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaker_city_overrides" (
	"speaker_id" integer PRIMARY KEY NOT NULL,
	"city" text
);
--> statement-breakpoint
CREATE TABLE "speaker_member_overrides" (
	"speaker_id" integer PRIMARY KEY NOT NULL,
	"active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "speakers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"normalized_firstname" text NOT NULL,
	"normalized_lastname" text NOT NULL,
	"company" text NOT NULL,
	"city" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "speakers_normalized_firstname_normalized_lastname_unique" UNIQUE("normalized_firstname","normalized_lastname")
);
--> statement-breakpoint
CREATE TABLE "talk_speakers" (
	"talk_id" uuid NOT NULL,
	"speaker_id" integer NOT NULL,
	CONSTRAINT "talk_speakers_talk_id_speaker_id_pk" PRIMARY KEY("talk_id","speaker_id")
);
--> statement-breakpoint
CREATE TABLE "talks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conference_name" text NOT NULL,
	"title" text,
	"normalized_title" text,
	"video_url" text,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"format" text,
	"level" text,
	"language" text,
	"slides_url" text,
	"description" text,
	"year" integer,
	"deleted_at" timestamp with time zone,
	"pending_video_url" text,
	"show_without_link" boolean DEFAULT false NOT NULL,
	"show_without_year" boolean DEFAULT false NOT NULL,
	"status" text,
	"validated" boolean DEFAULT false NOT NULL,
	CONSTRAINT "talks_conference_name_normalized_title_unique" UNIQUE("conference_name","normalized_title")
);
--> statement-breakpoint
ALTER TABLE "speaker_city_overrides" ADD CONSTRAINT "speaker_city_overrides_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaker_member_overrides" ADD CONSTRAINT "speaker_member_overrides_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_speakers" ADD CONSTRAINT "talk_speakers_talk_id_talks_id_fk" FOREIGN KEY ("talk_id") REFERENCES "public"."talks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_speakers" ADD CONSTRAINT "talk_speakers_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talks" ADD CONSTRAINT "talks_conference_name_conferences_name_fk" FOREIGN KEY ("conference_name") REFERENCES "public"."conferences"("name") ON DELETE no action ON UPDATE no action;