import { getAllSpeakers } from "../src/collects/get-all-speakers/get-all-speakers.js";
import { mergeSpeakers } from "../src/collects/get-all-speakers/mergeSpeakers.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { SPEAKERS_PATH } from "../src/data/paths.js";

async function main(): Promise<void> {
  const existing = await readJson<Speaker[]>(SPEAKERS_PATH, []);
  const found = await getAllSpeakers();
  const merged = mergeSpeakers(existing, found);
  await writeJson(SPEAKERS_PATH, merged);
  console.log(`${merged.length} speakers connus (${found.length} trouvés sur Slack cette fois).`);
}

main();
