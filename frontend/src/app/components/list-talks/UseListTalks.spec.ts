// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { useListTalks } from './UseListTalks'
import { talksClientKey } from '../../injectionKeys'
import type { ITalksClient } from '../../../infrastructure/ITalksClient'
import type { Talk } from '../../../domain/talks/Talk'

const fakeTalks: Talk[] = [
  {
    conference: { name: 'BreizhCamp', url: 'https://www.breizhcamp.org/programme' },
    speaker: { firstname: 'Alice', lastname: 'Martin', company: 'Shodo' },
    title: 'Intro TDD',
  },
]

const fakeClient: ITalksClient = {
  getTalks: async () => fakeTalks,
}

describe('useListTalks', () => {
  let result: ReturnType<typeof useListTalks>

  beforeEach(async () => {
    const app = createApp(defineComponent({
      setup() {
        result = useListTalks()
        return () => null
      },
    }))
    app.provide(talksClientKey, fakeClient)
    app.mount(document.createElement('div'))
  })

  it('returns the talks fetched from the client', async () => {
    expect(result.value).toEqual(fakeTalks)
  })
})
