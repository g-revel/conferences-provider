import { findTalkVideo } from "../src/collects/find-talk-video/findTalkVideo.js";
import { readTalks, writeTalks } from "../src/data/talksStore.js";

async function main(): Promise<void> {
  const talks = await readTalks();
  const talksToSearch = talks.filter((talk) => talk.videoUrl == null && talk.title != null);
  console.log(`${talksToSearch.length}/${talks.length} talk(s) sans lien vidéo (et avec un titre connu).`);

  const updated = [...talks];
  let found = 0;
  for (const talk of talksToSearch) {
    const index = updated.indexOf(talk);
    console.log(`→ ${talk.conference.name} : ${talk.title}`);
    try {
      const videoUrl = await findTalkVideo(talk);
      if (videoUrl) {
        console.log(`  trouvé : ${videoUrl}`);
        updated[index] = { ...talk, videoUrl };
        found++;
      } else {
        console.log("  rien trouvé");
      }
    } catch (err) {
      console.error("  échec :", err instanceof Error ? err.message : err);
    }
  }

  await writeTalks(updated);
  console.log(`${found} lien(s) vidéo ajouté(s).`);
}

main();
