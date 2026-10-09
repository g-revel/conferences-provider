import { Conference } from "../get-conferences/conference.js";

// Met à jour l'url et les éditions passées des événements trouvés, laisse les
// autres inchangés — n'ajoute ni ne supprime jamais d'entrée (contrairement à
// mergeSpeakers/mergeSpeaks, la liste des événements reste la liste statique
// saisie manuellement). `url` n'est jamais écrasée si déjà connue (une édition
// passée retrouvée par le balayage multi-années ne doit pas remplacer l'URL
// courante déjà validée) ; les autres éditions trouvées s'accumulent dans
// `pastEditionUrls`, fusionnées avec celles déjà connues et dédupliquées.
export function updateEventUrls(events: Conference[], foundEditionsByName: Map<string, string[]>): Conference[] {
  return events.map((event) => {
    const foundUrls = foundEditionsByName.get(event.name);
    if (!foundUrls || foundUrls.length === 0) return event;

    const url = event.url ?? foundUrls[0];
    const pastEditionUrls = new Set(event.pastEditionUrls ?? []);
    for (const foundUrl of foundUrls) {
      if (foundUrl !== url) pastEditionUrls.add(foundUrl);
    }

    return {
      ...event,
      url,
      ...(pastEditionUrls.size > 0 ? { pastEditionUrls: [...pastEditionUrls] } : {}),
    };
  });
}
