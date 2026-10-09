const SEARXNG_HOST = process.env.SEARXNG_HOST ?? "http://localhost:8080";

export interface YoutubeResult {
  url: string;
  title: string;
}

// Moteur `youtube` dédié de SearXNG (pas la recherche web générale) : résultats
// nettement plus propres pour cibler des vidéos de conférence par nom/titre.
export async function searchYoutube(query: string): Promise<YoutubeResult[]> {
  const url = `${SEARXNG_HOST}/search?q=${encodeURIComponent(query)}&engines=youtube&format=json`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`SearXNG error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { results?: Array<{ url?: unknown; title?: unknown }> };
  return (data.results ?? []).filter(
    (result): result is YoutubeResult => typeof result.url === "string" && typeof result.title === "string",
  );
}
