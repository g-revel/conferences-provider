const YEAR_RE = /\b(20\d{2})\b/;

export function extractYearFromConferenceName(conferenceName: string): number | null {
  const match = conferenceName.match(YEAR_RE);
  return match ? Number(match[1]) : null;
}
