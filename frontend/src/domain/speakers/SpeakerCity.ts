import type { Speaker } from './Speaker'

// `company` vient du domaine email Slack (ex. "shodo-rennes.io" -> "Shodo Rennes",
// voir member.functions.ts côté backend) et encode la ville dans la plupart des cas —
// mais pas toujours : certains suffixes sont des entités internes (studio, business
// units), pas des villes. Pas de champ "ville" dédié dans Slack : vérifié en pratique,
// le champ profil personnalisé existe dans le workspace mais n'est rempli par personne.
const NON_CITY_COMPANY_SUFFIXES = new Set(['studio', 'boost', 'apps'])

export function extractCityFromCompany(company: string): string | null {
  const parts = company.trim().split(/\s+/)
  if (parts.length < 2 || parts[0].toLowerCase() !== 'shodo') return null

  const suffix = parts.slice(1).join(' ')
  if (NON_CITY_COMPANY_SUFFIXES.has(suffix.toLowerCase())) return null

  return suffix
}

export function speakerCity(speaker: Speaker): string | null {
  return extractCityFromCompany(speaker.company)
}
