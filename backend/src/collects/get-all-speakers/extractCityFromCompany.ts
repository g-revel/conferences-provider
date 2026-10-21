// Doublon volontaire de frontend/src/domain/speakers/SpeakerCity.ts
// (`extractCityFromCompany`) — projets indépendants, pas de code partagé entre
// backend et frontend (voir CLAUDE.md). Garder les deux en synchro si l'un change.
//
// `company` vient du domaine email Slack (ex. "shodo-rennes.io" -> "Shodo Rennes",
// voir member.functions.ts) et encode la ville dans la plupart des cas — mais pas
// toujours : certains suffixes sont des entités internes (studio, business units),
// pas des villes.
const NON_CITY_COMPANY_SUFFIXES = new Set(['studio', 'boost', 'apps']);

// Le suffixe brut ne correspond pas toujours exactement au nom canonique de la
// ville (data/known-cities.json) — ex. domaine email "shodo-reunion.io" donne
// "Reunion" (sans accent, sans article), alors que la ville connue est
// "La Réunion". Sans ce correctif, le select admin traite le talker comme ayant
// une ville "Reunion" distincte plutôt que de matcher l'option existante.
const CITY_ALIASES: Record<string, string> = { Reunion: 'La Réunion' };

export function extractCityFromCompany(company: string): string | null {
  const parts = company.trim().split(/\s+/);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'shodo') return null;

  const suffix = parts.slice(1).join(' ');
  if (NON_CITY_COMPANY_SUFFIXES.has(suffix.toLowerCase())) return null;

  return CITY_ALIASES[suffix] ?? suffix;
}
