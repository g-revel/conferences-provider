import type { Talk } from '../Talk'

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
