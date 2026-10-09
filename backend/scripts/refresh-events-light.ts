import { Conference } from "../src/collects/get-conferences/conference.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { Speak } from "../src/collects/get-speaks/speak.js";
import { extractSpeaksFromConference } from "../src/collects/extract-speaks/extract-speaks.js";
import { mergeSpeaks } from "../src/collects/get-speaks/mergeSpeaks.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { EVENTS_PATH, SPEAKERS_PATH, TALKS_PATH } from "../src/data/paths.js";

function editionUrlsOf(event: Conference): string[] {
  return [event.url, ...(event.pastEditionUrls ?? [])].filter((url): url is string => !!url);
}

async function main(): Promise<void> {
  const events = await readJson<Conference[]>(EVENTS_PATH, []);
  const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, []);
  const existingTalks = await readJson<Speak[]>(TALKS_PATH, []);

  const editions = events.flatMap((event) => editionUrlsOf(event).map((url) => ({ name: event.name, url })));
  console.log(`${editions.length} édition(s) connue(s) à crawler sur ${events.length} événement(s).`);

  let found: Speak[] = [];
  for (const edition of editions) {
    console.log(`→ ${edition.name} (${edition.url})`);
    try {
      const speaks = await extractSpeaksFromConference(edition, speakers);
      console.log(`  ${speaks.length} talk(s) trouvé(s)`);
      found = found.concat(speaks);
    } catch (err) {
      console.error(`  échec pour ${edition.name} (${edition.url}) :`, err instanceof Error ? err.message : err);
    }
  }

  const merged = mergeSpeaks(existingTalks, found);
  await writeJson(TALKS_PATH, merged);
  console.log(`${merged.length} talks connus (${found.length} trouvés cette fois).`);
}

main();
