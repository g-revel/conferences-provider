import { describe, it, expect } from 'vitest'
import { filterTalksBySpeakerName, filterTalksByCategory, getAvailableCategories } from './FilterTalksFunctions'
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
]

describe('filterTalksBySpeakerName', () => {
  it('returns every talk when the term is empty', () => {
    expect(filterTalksBySpeakerName(talks, '')).toEqual(talks)
  })

  it('matches a speaker by first name, case-insensitively', () => {
    expect(filterTalksBySpeakerName(talks, 'alice')).toEqual([talks[0], talks[2]])
  })

  it('matches a speaker by last name', () => {
    expect(filterTalksBySpeakerName(talks, 'Dupont')).toEqual([talks[1]])
  })

  it('matches any co-presenter of a co-animated talk', () => {
    expect(filterTalksBySpeakerName(talks, 'Lenoir')).toEqual([talks[2]])
  })

  it('returns an empty array when no speaker matches', () => {
    expect(filterTalksBySpeakerName(talks, 'Inconnu')).toEqual([])
  })

  it('ignores surrounding whitespace', () => {
    expect(filterTalksBySpeakerName(talks, '  alice  ')).toEqual([talks[0], talks[2]])
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
