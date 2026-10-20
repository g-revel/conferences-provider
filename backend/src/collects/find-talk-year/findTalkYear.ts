import { Speak } from "../get-speaks/speak.js";
import { extractYearFromConferenceName } from "./extractYearFromConferenceName.js";
import { fetchVideoPublishYear } from "./fetchVideoPublishYear.js";

// Le nom de la conférence (ex. "NewCrafts 2025") est préféré à la vidéo quand il
// contient une année : plus rapide, pas d'I/O, et l'édition d'un event peut
// différer de l'année de mise en ligne de la vidéo (replay publié plus tard).
export async function findTalkYear(speak: Speak): Promise<number | null> {
  const fromName = extractYearFromConferenceName(speak.conference.name);
  if (fromName != null) return fromName;

  if (speak.videoUrl) return fetchVideoPublishYear(speak.videoUrl);

  return null;
}
