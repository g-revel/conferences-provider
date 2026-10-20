import { Conference } from "../src/collects/get-conferences/conference.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { Speak } from "../src/collects/get-speaks/speak.js";
import { findSpeakerTalksOnYoutube } from "../src/collects/find-speaker-talks-on-youtube/findSpeakerTalksOnYoutube.js";
import { groupCoPresentedTalks } from "../src/collects/extract-speaks/groupCoPresentedTalks.js";
import { mergeSpeaks } from "../src/collects/get-speaks/mergeSpeaks.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { EVENTS_PATH, SPEAKERS_PATH, TALKS_PATH } from "../src/data/paths.js";
import { normalizeForMatch } from "../src/string.functions.js";

// Demandé explicitement par l'utilisateur, en priorité sur une recherche YouTube
// par nom ouverte à l'ensemble des ~220 speakers connus (coûteux en appels Ollama,
// bruit potentiellement plus élevé sur des noms moins "googlables").
const PRIORITY_SPEAKER_NAMES = [
  { firstname: "Julien", lastname: "Topcu" },
  { firstname: "Thomas", lastname: "Pierrain" },
  { firstname: "Nathan", lastname: "Castelein" },
];

function findKnownSpeaker(speakers: Speaker[], firstname: string, lastname: string): Speaker | undefined {
  return speakers.find(
    (speaker) =>
      normalizeForMatch(speaker.firstname) === normalizeForMatch(firstname) &&
      normalizeForMatch(speaker.lastname) === normalizeForMatch(lastname),
  );
}

// Le nom de conférence déduit par le LLM depuis un titre/une chaîne YouTube peut
// différer légèrement de notre orthographe canonique (ex. "MiXiT" vs "MixIT") —
// sans ça, mergeSpeaks ne dédupliquerait pas un talk déjà connu via le scraping
// de site. Limite résiduelle assumée : un talk retrouvé sous un nom de conférence
// totalement absent de events.json (ex. "NewCrafts 2025") ne peut pas être
// canonicalisé de cette façon.
function canonicalizeConferenceName(name: string, knownEvents: Conference[]): string {
  const match = knownEvents.find((event) => normalizeForMatch(event.name) === normalizeForMatch(name));
  return match ? match.name : name;
}

async function main(): Promise<void> {
  const events = await readJson<Conference[]>(EVENTS_PATH, []);
  const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, []);
  const existingTalks = await readJson<Speak[]>(TALKS_PATH, []);
  const knownVideoUrls = new Set(existingTalks.map((talk) => talk.videoUrl).filter((url): url is string => !!url));

  let found: Speak[] = [];
  for (const { firstname, lastname } of PRIORITY_SPEAKER_NAMES) {
    const speaker = findKnownSpeaker(speakers, firstname, lastname);
    if (!speaker) {
      console.error(`Speaker prioritaire introuvable dans speakers.json : ${firstname} ${lastname}`);
      continue;
    }

    console.log(`→ recherche YouTube pour ${speaker.firstname} ${speaker.lastname}...`);
    try {
      const speaks = await findSpeakerTalksOnYoutube(speaker, speakers);
      const newSpeaks = speaks
        .filter((speak) => !speak.videoUrl || !knownVideoUrls.has(speak.videoUrl))
        .map((speak) => ({ ...speak, conference: { name: canonicalizeConferenceName(speak.conference.name, events) } }));
      console.log(`  ${speaks.length} talk(s) détecté(s), ${newSpeaks.length} nouveau(x)`);
      found = found.concat(newSpeaks);
    } catch (err) {
      console.error(`  échec pour ${speaker.firstname} ${speaker.lastname} :`, err instanceof Error ? err.message : err);
    }
  }

  const merged = mergeSpeaks(existingTalks, groupCoPresentedTalks(found));
  await writeJson(TALKS_PATH, merged);
  console.log(`${merged.length} talks connus (${found.length} nouveau(x) trouvé(s) cette fois).`);
}

main();
