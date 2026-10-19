// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useListTalks, type UseListTalksResult } from './UseListTalks'
import { talksClientKey } from '../../injectionKeys'
import type { ITalksClient } from '../../../infrastructure/ITalksClient'
import type { Talk } from '../../../domain/talks/Talk'

const fakeTalks: Talk[] = [
  {
    conference: { name: 'BreizhCamp', url: 'https://www.breizhcamp.org/programme' },
    speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
    title: 'Intro TDD',
  },
]

function mountWithClient(client: ITalksClient): UseListTalksResult {
  let result!: UseListTalksResult
  const app = createApp(defineComponent({
    setup() {
      result = useListTalks()
      return () => null
    },
  }))
  app.provide(talksClientKey, client)
  app.mount(document.createElement('div'))
  return result
}

describe('useListTalks', () => {
  it('starts in a loading state', () => {
    const result = mountWithClient({ getTalks: () => new Promise(() => {}) })

    expect(result.isLoading.value).toBe(true)
    expect(result.error.value).toBe(false)
  })

  it('returns the talks fetched from the client and clears isLoading', async () => {
    const result = mountWithClient({ getTalks: async () => fakeTalks })
    await Promise.resolve()
    await Promise.resolve()

    expect(result.talks.value).toEqual(fakeTalks)
    expect(result.isLoading.value).toBe(false)
    expect(result.error.value).toBe(false)
  })

  it('sets error and clears isLoading when the client throws', async () => {
    const result = mountWithClient({ getTalks: async () => { throw new Error('network error') } })
    await Promise.resolve()
    await Promise.resolve()

    expect(result.error.value).toBe(true)
    expect(result.isLoading.value).toBe(false)
    expect(result.talks.value).toEqual([])
  })
})
