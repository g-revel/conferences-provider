// Pas d'API YouTube (clé requise) : la page watch publique expose la date de
// publication dans une balise meta schema.org, lisible sans authentification.
const PUBLISH_DATE_RE = /itemprop="datePublished" content="(\d{4})-\d{2}-\d{2}/;

export async function fetchVideoPublishYear(videoUrl: string): Promise<number | null> {
  const response = await fetch(videoUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) return null;

  const html = await response.text();
  const match = html.match(PUBLISH_DATE_RE);
  return match ? Number(match[1]) : null;
}
