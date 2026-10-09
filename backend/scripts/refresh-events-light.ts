import { Conference } from "../src/collects/get-conferences/conference.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { Speak } from "../src/collects/get-speaks/speak.js";
import { extractSpeaksFromConference } from "../src/collects/extract-speaks/extract-speaks.js";
import { mergeSpeaks } from "../src/collects/get-speaks/mergeSpeaks.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { EVENTS_PATH, SPEAKERS_PATH, TALKS_PATH } from "../src/data/paths.js";

async function main(): Promise<void> {
  const events = await readJson<Conference[]>(EVENTS_PATH, []);
  const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, []);
  const existingTalks = await readJson<Speak[]>(TALKS_PATH, []);

  const eventsWithUrl = events.filter((e) => !!e.url);
  console.log(`${eventsWithUrl.length}/${events.length} événements ont une URL connue.`);

  let found: Speak[] = [];
  for (const event of eventsWithUrl) {
    console.log(`→ ${event.name} (${event.url})`);
    try {
      const speaks = await extractSpeaksFromConference(event, speakers);
      console.log(`  ${speaks.length} talk(s) trouvé(s)`);
      found = found.concat(speaks);
    } catch (err) {
      console.error(`  échec pour ${event.name} :`, err instanceof Error ? err.message : err);
    }
  }

  const merged = mergeSpeaks(existingTalks, found);
  await writeJson(TALKS_PATH, merged);
  console.log(`${merged.length} talks connus (${found.length} trouvés cette fois).`);
}

main();
