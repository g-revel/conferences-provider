// Script ponctuel, lancé manuellement (comme les autres scripts de pipeline) :
// lit les data/*.json existants et les upsert dans Postgres (Neon). Lit volontairement
// readJson + les chemins historiques directement (seul endroit encore autorisé à le
// faire une fois la bascule des routes/scripts effectuée) — idempotent (chaque writeX
// est un upsert), donc relançable sans risque si les JSON changent avant la bascule.
import { readJson } from "../src/data/jsonStore.js";
import {
  EVENTS_PATH,
  SPEAKERS_PATH,
  TALKS_PATH,
  SPEAKER_CITY_OVERRIDES_PATH,
  SPEAKER_MEMBER_OVERRIDES_PATH,
  KNOWN_CITIES_PATH,
} from "../src/data/paths.js";
import { Conference } from "../src/collects/get-conferences/conference.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { Speak } from "../src/collects/get-speaks/speak.js";
import { SpeakerCityOverride } from "../src/collects/get-all-speakers/speakerCityOverride.js";
import { SpeakerMemberOverride } from "../src/collects/get-all-speakers/speakerMemberOverride.js";
import { readConferences, writeConferences } from "../src/data/conferencesStore.js";
import { readSpeakers, writeSpeakers } from "../src/data/speakersStore.js";
import { readTalks, writeTalks } from "../src/data/talksStore.js";
import { readSpeakerCityOverrides, writeSpeakerCityOverrides } from "../src/data/speakerCityOverridesStore.js";
import { readSpeakerMemberOverrides, writeSpeakerMemberOverrides } from "../src/data/speakerMemberOverridesStore.js";
import { readKnownCities, writeKnownCities } from "../src/data/knownCitiesStore.js";

// Ordre obligatoire à cause des FK : conferences -> speakers -> talks -> overrides -> known_cities.
async function main(): Promise<void> {
  const conferences = await readJson<Conference[]>(EVENTS_PATH, []);
  await writeConferences(conferences);
  console.log(`conferences: ${conferences.length} lues, ${(await readConferences()).length} en base`);

  const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, []);
  await writeSpeakers(speakers);
  console.log(`speakers: ${speakers.length} lus, ${(await readSpeakers()).length} en base`);

  const talks = await readJson<Speak[]>(TALKS_PATH, []);
  await writeTalks(talks);
  console.log(`talks: ${talks.length} lus, ${(await readTalks()).length} en base`);

  const cityOverrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, []);
  await writeSpeakerCityOverrides(cityOverrides);
  console.log(`speaker-city-overrides: ${cityOverrides.length} lus, ${(await readSpeakerCityOverrides()).length} en base`);

  const memberOverrides = await readJson<SpeakerMemberOverride[]>(SPEAKER_MEMBER_OVERRIDES_PATH, []);
  await writeSpeakerMemberOverrides(memberOverrides);
  console.log(
    `speaker-member-overrides: ${memberOverrides.length} lus, ${(await readSpeakerMemberOverrides()).length} en base`,
  );

  const cities = await readJson<string[]>(KNOWN_CITIES_PATH, []);
  await writeKnownCities(cities);
  console.log(`known-cities: ${cities.length} lues, ${(await readKnownCities()).length} en base`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
