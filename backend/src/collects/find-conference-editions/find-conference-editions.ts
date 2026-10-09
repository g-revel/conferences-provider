import { buildSearchQuery } from "./searchQuery.js";
import { parseSearchResults } from "./parseSearchResults.js";

const SEARXNG_HOST = process.env.SEARXNG_HOST ?? "http://localhost:8080";

// 5 éditions (année courante incluse) : compromis entre couverture historique
// et nombre de requêtes SearXNG / pages à crawler ensuite par événement.
const EDITIONS_TO_SEARCH = 5;

export async function findConferenceEditionUrl(
  eventName: string,
  year: number = new Date().getFullYear(),
): Promise<string | null> {
  const query = buildSearchQuery(eventName, year);
  const url = `${SEARXNG_HOST}/search?q=${encodeURIComponent(query)}&format=json`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`SearXNG error ${response.status}: ${await response.text()}`);
  }

  return parseSearchResults(await response.json());
}

// Une recherche par année (pas une seule requête "BreizhCamp programme" sans année) :
// le moteur ne renvoie quasi toujours que l'édition la plus récente sinon.
export async function findConferenceEditionUrls(eventName: string): Promise<string[]> {
  const currentYear = new Date().getFullYear();
  const urls = new Set<string>();

  for (let year = currentYear; year > currentYear - EDITIONS_TO_SEARCH; year--) {
    const url = await findConferenceEditionUrl(eventName, year);
    if (url) urls.add(url);
  }

  return [...urls];
}
