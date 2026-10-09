import { Conference } from "../get-conferences/conference.js";

// Met à jour l'url des événements trouvés, laisse les autres inchangés —
// n'ajoute ni ne supprime jamais d'entrée (contrairement à mergeSpeakers/mergeSpeaks,
// la liste des événements elle-même reste la liste statique saisie manuellement).
export function updateEventUrls(events: Conference[], foundUrls: Map<string, string>): Conference[] {
  return events.map((event) => {
    const foundUrl = foundUrls.get(event.name);
    return foundUrl ? { ...event, url: foundUrl } : event;
  });
}
