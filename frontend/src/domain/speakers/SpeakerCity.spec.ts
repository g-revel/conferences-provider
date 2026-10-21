import { describe, it, expect } from 'vitest'
import { extractCityFromCompany, speakerCity } from './SpeakerCity'

describe('extractCityFromCompany', () => {
  it('extracts the city from a "Shodo <City>" company', () => {
    expect(extractCityFromCompany('Shodo Rennes')).toBe('Rennes')
    expect(extractCityFromCompany('Shodo Lyon')).toBe('Lyon')
    expect(extractCityFromCompany('Shodo Lille')).toBe('Lille')
    expect(extractCityFromCompany('Shodo Nantes')).toBe('Nantes')
  })

  it('returns null for the bare "Shodo" company (no city specified)', () => {
    expect(extractCityFromCompany('Shodo')).toBeNull()
  })

  it('returns null for internal business units that are not cities', () => {
    expect(extractCityFromCompany('Shodo Studio')).toBeNull()
    expect(extractCityFromCompany('Shodo Boost')).toBeNull()
    expect(extractCityFromCompany('Shodo Apps')).toBeNull()
  })

  it('returns null for a single-word company with no space (e.g. a portmanteau)', () => {
    expect(extractCityFromCompany('Shodops')).toBeNull()
  })

  it('returns null for a company not starting with Shodo', () => {
    expect(extractCityFromCompany('Autre Entreprise')).toBeNull()
  })

  it('normalizes "Reunion" (from the Slack email domain) to the canonical "La Réunion"', () => {
    expect(extractCityFromCompany('Shodo Reunion')).toBe('La Réunion')
  })
})

describe('speakerCity', () => {
  it('derives the city from the speaker company', () => {
    expect(speakerCity({ firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes' })).toBe('Rennes')
  })

  it('returns null when the speaker has no determinable city', () => {
    expect(speakerCity({ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo' })).toBeNull()
  })

  it('prefers an admin-set city override over the company-derived guess', () => {
    expect(speakerCity({ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo', city: 'Paris' })).toBe('Paris')
  })

  it('an explicit null override means "no city", even if company would suggest one', () => {
    expect(speakerCity({ firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes', city: null })).toBeNull()
  })
})
