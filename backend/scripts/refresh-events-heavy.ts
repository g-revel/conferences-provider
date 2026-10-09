import { Conference } from "../src/collects/get-conferences/conference.js";
import { findConferenceEditionUrl } from "../src/collects/find-conference-editions/find-conference-editions.js";
import { updateEventUrls } from "../src/collects/find-conference-editions/updateEventUrls.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { EVENTS_PATH } from "../src/data/paths.js";

async function main(): Promise<void> {
  const events = await readJson<Conference[]>(EVENTS_PATH, []);
  const eventsWithoutUrl = events.filter((e) => !e.url);
  console.log(`${eventsWithoutUrl.length}/${events.length} événements sans URL connue.`);

  const foundUrls = new Map<string, string>();
  for (const event of eventsWithoutUrl) {
    console.log(`→ recherche pour ${event.name}...`);
    try {
      const url = await findConferenceEditionUrl(event.name);
      if (url) {
        console.log(`  trouvé : ${url}`);
        foundUrls.set(event.name, url);
      } else {
        console.log("  rien trouvé");
      }
    } catch (err) {
      console.error(`  échec pour ${event.name} :`, err instanceof Error ? err.message : err);
    }
  }

  const updated = updateEventUrls(events, foundUrls);
  await writeJson(EVENTS_PATH, updated);
  console.log(`${foundUrls.size} URL(s) mise(s) à jour.`);
}

main();
