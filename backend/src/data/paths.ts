import { fileURLToPath } from "node:url";
import path from "node:path";

// Résout vers backend/data quelle que soit la position de ce fichier (src/ en dev, dist/ en prod) :
// src/data/paths.ts et dist/data/paths.js sont tous les deux à exactement deux niveaux sous backend/.
const dataDir = fileURLToPath(new URL("../../data", import.meta.url));

export const EVENTS_PATH = path.join(dataDir, "events.json");
export const SPEAKERS_PATH = path.join(dataDir, "speakers.json");
export const TALKS_PATH = path.join(dataDir, "talks.json");
// Séparé de speakers.json (régénéré en entier par refresh:speakers) : un override
// de ville saisi côté admin serait perdu au prochain refresh Slack s'il vivait là.
export const SPEAKER_CITY_OVERRIDES_PATH = path.join(dataDir, "speaker-city-overrides.json");
// Liste statique des villes proposées dans le sélecteur admin — volontairement
// distincte des villes dérivées de `company` (SpeakerCity.ts côté frontend) :
// une ville y entre une fois pour toutes via "Ajouter une ville...", jamais
// recalculée/écrasée par un refresh.
export const KNOWN_CITIES_PATH = path.join(dataDir, "known-cities.json");
