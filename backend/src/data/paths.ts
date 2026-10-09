import { fileURLToPath } from "node:url";
import path from "node:path";

// Résout vers backend/data quelle que soit la position de ce fichier (src/ en dev, dist/ en prod) :
// src/data/paths.ts et dist/data/paths.js sont tous les deux à exactement deux niveaux sous backend/.
const dataDir = fileURLToPath(new URL("../../data", import.meta.url));

export const EVENTS_PATH = path.join(dataDir, "events.json");
export const SPEAKERS_PATH = path.join(dataDir, "speakers.json");
export const TALKS_PATH = path.join(dataDir, "talks.json");
