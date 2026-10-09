interface SearxngResponse {
  results?: Array<{ url?: unknown }>;
}

export function parseSearchResults(data: unknown): string | null {
  const results = (data as SearxngResponse).results;
  if (!results || results.length === 0) return null;

  const firstUrl = results[0].url;
  return typeof firstUrl === "string" ? firstUrl : null;
}
