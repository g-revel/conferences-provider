import { describe, it, expect } from 'vitest'
import {
  filterTalksBySearchTerm,
  filterTalksByCategory,
  getAvailableCategories,
  getTalkCity,
  getAvailableCities,
  filterTalksByCity,
} from './FilterTalksFunctions'
import type { Talk } from '../Talk'

const talks: Talk[] = [
  {
    conference: { name: 'BreizhCamp' },
    speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
    title: 'Intro TDD',
    category: 'Architecture & Craft',
  },
  {
    conference: { name: 'MixIT' },
    speakers: [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo' }],
    title: 'Sécuriser son API',
    category: 'Sécurité',
  },
  {
    conference: { name: 'DevFest' },
    speakers: [
      { firstname: 'Alice', lastname: 'Carbonnel', company: 'Shodo' },
      { firstname: 'Carol', lastname: 'Lenoir', company: 'Shodo' },
    ],
    title: 'Talk co-animé',
    category: 'Architecture & Craft',
  },
  {
    conference: { name: 'Paris Web', url: 'https://paris-web.fr' },
    speakers: [{ firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes' }],
    title: 'Un talk parisien donné par une Rennaise',
  },
]

describe('filterTalksBySearchTerm', () => {
  it('returns every talk when the term is empty', () => {
    expect(filterTalksBySearchTerm(talks, '')).toEqual(talks)
  })

  it('matches a speaker by first name, case-insensitively', () => {
    expect(filterTalksBySearchTerm(talks, 'alice')).toEqual([talks[0], talks[2]])
  })

  it('matches a speaker by last name', () => {
    expect(filterTalksBySearchTerm(talks, 'Dupont')).toEqual([talks[1]])
  })

  it('matches any co-presenter of a co-animated talk', () => {
    expect(filterTalksBySearchTerm(talks, 'Lenoir')).toEqual([talks[2]])
  })

  it('matches the talk title', () => {
    expect(filterTalksBySearchTerm(talks, 'Sécuriser')).toEqual([talks[1]])
  })

  it('matches the conference name', () => {
    expect(filterTalksBySearchTerm(talks, 'MixIT')).toEqual([talks[1]])
  })

  it('matches the category', () => {
    expect(filterTalksBySearchTerm(talks, 'Architecture')).toEqual([talks[0], talks[2]])
  })

  it('matches a speaker company', () => {
    expect(filterTalksBySearchTerm(talks, 'Shodo Rennes')).toEqual([talks[3]])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterTalksBySearchTerm(talks, 'Inconnu')).toEqual([])
  })

  it('ignores surrounding whitespace', () => {
    expect(filterTalksBySearchTerm(talks, '  alice  ')).toEqual([talks[0], talks[2]])
  })
})

describe('filterTalksByCategory', () => {
  it('returns every talk when the category is empty', () => {
    expect(filterTalksByCategory(talks, '')).toEqual(talks)
  })

  it('returns only talks matching the given category', () => {
    expect(filterTalksByCategory(talks, 'Sécurité')).toEqual([talks[1]])
  })

  it('returns an empty array when no talk matches the category', () => {
    expect(filterTalksByCategory(talks, 'IA & Data')).toEqual([])
  })
})

describe('getAvailableCategories', () => {
  it('returns the distinct categories present in the talks, sorted', () => {
    expect(getAvailableCategories(talks)).toEqual(['Architecture & Craft', 'Sécurité'])
  })

  it('ignores talks without a category', () => {
    const withoutCategory: Talk = { conference: { name: 'X' }, speakers: [], title: 'Y' }
    expect(getAvailableCategories([...talks, withoutCategory])).toEqual(['Architecture & Craft', 'Sécurité'])
  })

  it('returns an empty array when there are no talks', () => {
    expect(getAvailableCategories([])).toEqual([])
  })
})

describe('getTalkCity', () => {
  it('returns the city of the speaker, regardless of the conference location', () => {
    // le talk a lieu "Paris Web" mais la speakeuse est de Rennes -> ville = Rennes
    expect(getTalkCity(talks[3])).toBe('Rennes')
  })

  it('returns null when no speaker has a determinable city', () => {
    expect(getTalkCity(talks[0])).toBeNull()
  })
})

describe('getAvailableCities', () => {
  it('returns the distinct cities present in the talks, sorted', () => {
    expect(getAvailableCities(talks)).toEqual(['Rennes'])
  })

  it('returns an empty array when no talk has a determinable city', () => {
    expect(getAvailableCities(talks.slice(0, 3))).toEqual([])
  })
})

describe('filterTalksByCity', () => {
  it('returns every talk when the city is empty', () => {
    expect(filterTalksByCity(talks, '')).toEqual(talks)
  })

  it('returns only talks whose speaker is from the given city', () => {
    expect(filterTalksByCity(talks, 'Rennes')).toEqual([talks[3]])
  })

  it('returns an empty array when no talk matches the city', () => {
    expect(filterTalksByCity(talks, 'Lyon')).toEqual([])
  })
})
