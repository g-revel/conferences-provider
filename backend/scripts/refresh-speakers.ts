import { getAllSpeakers } from "../src/collects/get-all-speakers/get-all-speakers.js";
import { mergeSpeakers } from "../src/collects/get-all-speakers/mergeSpeakers.js";
import { readSpeakers, writeSpeakers } from "../src/data/speakersStore.js";

async function main(): Promise<void> {
  const existing = await readSpeakers();
  const found = await getAllSpeakers();
  const merged = mergeSpeakers(existing, found);
  await writeSpeakers(merged);
  console.log(`${merged.length} speakers connus (${found.length} trouvés sur Slack cette fois).`);
}

main();
