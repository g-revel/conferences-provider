import type { Talk } from '../Talk'
import { speakerCity } from '../../speakers/SpeakerCity'

export function filterTalksBySpeakerName(talks: Talk[], term: string): Talk[] {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return talks

  return talks.filter((talk) =>
    talk.speakers.some((speaker) => `${speaker.firstname} ${speaker.lastname}`.toLowerCase().includes(normalized)),
  )
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
