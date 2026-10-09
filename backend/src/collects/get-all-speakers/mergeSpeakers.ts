import { Speaker } from "./speaker.js";

function identity(speaker: Speaker): string {
  return `${speaker.firstname}|${speaker.lastname}`;
}

// Additif uniquement : les entrées déjà connues mais disparues de `found`
// (ex. membre parti de Slack) restent dans le résultat, seule `company` est
// rafraîchie sur les entrées retrouvées.
export function mergeSpeakers(existing: Speaker[], found: Speaker[]): Speaker[] {
  const byIdentity = new Map(existing.map((speaker) => [identity(speaker), speaker]));
  for (const speaker of found) {
    byIdentity.set(identity(speaker), speaker);
  }
  return [...byIdentity.values()];
}
