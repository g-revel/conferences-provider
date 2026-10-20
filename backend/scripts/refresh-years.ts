import { Speak } from "../src/collects/get-speaks/speak.js";
import { findTalkYear } from "../src/collects/find-talk-year/findTalkYear.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { TALKS_PATH } from "../src/data/paths.js";

async function main(): Promise<void> {
  const talks = await readJson<Speak[]>(TALKS_PATH, []);
  const talksToSearch = talks.filter((talk) => talk.year == null);
  console.log(`${talksToSearch.length}/${talks.length} talk(s) sans année connue.`);

  const updated = [...talks];
  let found = 0;
  for (const talk of talksToSearch) {
    const index = updated.indexOf(talk);
    console.log(`→ ${talk.conference.name} : ${talk.title ?? "(sans titre)"}`);
    try {
      const year = await findTalkYear(talk);
      if (year) {
        console.log(`  trouvée : ${year}`);
        updated[index] = { ...talk, year };
        found++;
      } else {
        console.log("  rien trouvé");
      }
    } catch (err) {
      console.error("  échec :", err instanceof Error ? err.message : err);
    }
  }

  await writeJson(TALKS_PATH, updated);
  console.log(`${found} année(s) ajoutée(s).`);
}

main();
