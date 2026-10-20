import { Conference } from "../src/collects/get-conferences/conference.js";
import { Speaker } from "../src/collects/get-all-speakers/speaker.js";
import { Speak } from "../src/collects/get-speaks/speak.js";
import { findSpeakerTalksOnYoutube } from "../src/collects/find-speaker-talks-on-youtube/findSpeakerTalksOnYoutube.js";
import { groupCoPresentedTalks } from "../src/collects/extract-speaks/groupCoPresentedTalks.js";
import { mergeSpeaks } from "../src/collects/get-speaks/mergeSpeaks.js";
import { readJson, writeJson } from "../src/data/jsonStore.js";
import { EVENTS_PATH, SPEAKERS_PATH, TALKS_PATH } from "../src/data/paths.js";
import { normalizeForMatch } from "../src/string.functions.js";

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

  // Un membre parti (active: false) n'est volontairement pas cherché ici : on ne
  // découvre pas de *nouveaux* talks pour quelqu'un qui n'est plus chez Shodo
  // (demande explicite) — ses talks déjà connus restent affichés, juste dans la
  // section "anciens membres" du portail plutôt que la liste principale.
  const activeSpeakers = speakers.filter((speaker) => speaker.active !== false);
  console.log(`${activeSpeakers.length}/${speakers.length} speaker(s) actif(s) à chercher sur YouTube.`);

  let found: Speak[] = [];
  for (const speaker of activeSpeakers) {
    console.log(`→ recherche YouTube pour ${speaker.firstname} ${speaker.lastname}...`);
    try {
      const speaks = await findSpeakerTalksOnYoutube(speaker, speakers);
      const newSpeaks = speaks
        .filter((speak) => !speak.videoUrl || !knownVideoUrls.has(speak.videoUrl))
        .map((speak) => ({ ...speak, conference: { name: canonicalizeConferenceName(speak.conference.name, events) } }));
      console.log(`  ${speaks.length} talk(s) détecté(s), ${newSpeaks.length} nouveau(x)`);
      // Mis à jour en cours de boucle (pas seulement avant) : un talk co-présenté par
      // deux speakers actifs peut être retrouvé une seconde fois quand on arrive au
      // nom du co-présentateur plus loin dans la liste — évite d'ajouter deux fois
      // la même vidéo à `found` (groupCoPresentedTalks fusionne par titre, pas par
      // URL, donc ce n'est pas une garantie à 100%, mais réduit le bruit en pratique).
      for (const speak of newSpeaks) {
        if (speak.videoUrl) knownVideoUrls.add(speak.videoUrl);
      }
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
