import { Conference } from "./conference.js";
import { normalizeForMatch } from "../../string.functions.js";

// Le nom de conférence déduit par le LLM depuis un titre/une chaîne YouTube peut
// différer légèrement de notre orthographe canonique (ex. "MiXiT" vs "MixIT") —
// sans ça, mergeSpeaks ne dédupliquerait pas un talk déjà connu via le scraping
// de site. Limite résiduelle assumée : un talk retrouvé sous un nom de conférence
// totalement absent des conférences connues (ex. "NewCrafts 2025") ne peut pas
// être canonicalisé de cette façon.
export function canonicalizeConferenceName(name: string, knownEvents: Conference[]): string {
  const match = knownEvents.find((event) => normalizeForMatch(event.name) === normalizeForMatch(name));
  return match ? match.name : name;
}
