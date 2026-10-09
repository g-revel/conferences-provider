import { Conference } from "../src/collects/get-conferences/conference.js";
import { findConferenceEditionUrls } from "../src/collects/find-conference-editions/find-conference-editions.js";
import { updateEventUrls } from "../src/collects/find-conference-editions/updateEventUrls.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { EVENTS_PATH } from "../src/data/paths.js";

async function main(): Promise<void> {
  const events = await readJson<Conference[]>(EVENTS_PATH, []);
  console.log(`Recherche des éditions (courante + jusqu'à 4 ans en arrière) pour ${events.length} événement(s).`);

  const foundEditionsByName = new Map<string, string[]>();
  for (const event of events) {
    console.log(`→ recherche pour ${event.name}...`);
    try {
      const urls = await findConferenceEditionUrls(event.name);
      if (urls.length > 0) {
        console.log(`  ${urls.length} édition(s) trouvée(s)`);
        foundEditionsByName.set(event.name, urls);
      } else {
        console.log("  rien trouvé");
      }
    } catch (err) {
      console.error(`  échec pour ${event.name} :`, err instanceof Error ? err.message : err);
    }
  }

  const updated = updateEventUrls(events, foundEditionsByName);
  await writeJson(EVENTS_PATH, updated);
  console.log(`${foundEditionsByName.size} événement(s) mis à jour.`);
}

main();
