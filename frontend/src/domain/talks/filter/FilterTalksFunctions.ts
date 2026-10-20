import type { Talk } from '../Talk'
import { speakerCity } from '../../speakers/SpeakerCity'

// Cherche sur tout ce qui peut identifier un talk pour l'utilisateur, pas seulement
// le nom du speaker : titre, conférence, catégorie, format, niveau, langue,
// description, entreprise et ville du speaker.
function searchableFields(talk: Talk): string[] {
  return [
    talk.title,
    talk.conference.name,
    talk.category,
    talk.format,
    talk.level,
    talk.language,
    talk.description,
    ...talk.speakers.flatMap((speaker) => [`${speaker.firstname} ${speaker.lastname}`, speaker.company, speaker.city]),
  ].filter((field): field is string => !!field)
}

export function filterTalksBySearchTerm(talks: Talk[], term: string): Talk[] {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return talks

  return talks.filter((talk) => searchableFields(talk).some((field) => field.toLowerCase().includes(normalized)))
}

export function filterTalksByCategory(talks: Talk[], category: string): Talk[] {
  if (!category) return talks

  return talks.filter((talk) => talk.category === category)
}

// Dérivée des données elles-mêmes (pas d'enum séparée à maintenir) : une catégorie
// ajoutée directement dans data/talks.json apparaît automatiquement dans le filtre.
export function getAvailableCategories(talks: Talk[]): string[] {
  const categories = new Set(talks.map((talk) => talk.category).filter((category): category is string => !!category))
  return [...categories].sort((a, b) => a.localeCompare(b))
}

// La ville du talk est celle du speaker (pas de la conférence) : un talk donné à
// Paris par quelqu'un de Rennes doit être classé "Rennes". Premier speaker dont la
// ville est déterminable (un talk co-animé peut mélanger des speakers sans ville
// connue et d'autres avec).
export function getTalkCity(talk: Talk): string | null {
  for (const speaker of talk.speakers) {
    const city = speakerCity(speaker)
    if (city) return city
  }
  return null
}

export function getAvailableCities(talks: Talk[]): string[] {
  const cities = new Set(talks.map(getTalkCity).filter((city): city is string => !!city))
  return [...cities].sort((a, b) => a.localeCompare(b))
}

export function filterTalksByCity(talks: Talk[], city: string): Talk[] {
  if (!city) return talks

  return talks.filter((talk) => talk.speakers.some((speaker) => speakerCity(speaker) === city))
}

// Un talk n'est "d'anciens membres" que si AUCUN de ses speakers n'est encore chez
// Shodo (un talk co-animé par un membre actuel et un ancien reste dans la liste
// principale). `active` absent/true = toujours chez Shodo, par défaut optimiste.
export function isFormerMembersTalk(talk: Talk): boolean {
  return talk.speakers.every((speaker) => speaker.active === false)
}

export function filterCurrentMembersTalks(talks: Talk[]): Talk[] {
  return talks.filter((talk) => !isFormerMembersTalk(talk))
}

export function filterFormerMembersTalks(talks: Talk[]): Talk[] {
  return talks.filter(isFormerMembersTalk)
}
