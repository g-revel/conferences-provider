import { buildSearchQuery } from "./searchQuery.js";
import { parseSearchResults } from "./parseSearchResults.js";

const SEARXNG_HOST = process.env.SEARXNG_HOST ?? "http://localhost:8080";

export async function findConferenceEditionUrl(eventName: string): Promise<string | null> {
  const query = buildSearchQuery(eventName);
  const url = `${SEARXNG_HOST}/search?q=${encodeURIComponent(query)}&format=json`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`SearXNG error ${response.status}: ${await response.text()}`);
  }

  return parseSearchResults(await response.json());
}
