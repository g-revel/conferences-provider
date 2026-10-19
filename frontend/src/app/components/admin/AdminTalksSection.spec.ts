// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminTalksSection from './AdminTalksSection.vue'
import type { Talk } from '../../../domain/talks/Talk'

const activeTalk: Talk = {
  id: 'talk-1',
  conference: { name: 'BreizhCamp' },
  speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
  title: 'Intro TDD',
}
const deletedTalk: Talk = {
  id: 'talk-2',
  conference: { name: 'MixIT' },
  speakers: [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo' }],
  title: 'Supprimé',
  deletedAt: '2026-01-01T00:00:00.000Z',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AdminTalksSection', () => {
  it('renders one item per talk with title, conference and speakers', () => {
    const wrapper = mount(AdminTalksSection, { props: { talks: [activeTalk] } })

    expect(wrapper.text()).toContain('Intro TDD')
    expect(wrapper.text()).toContain('BreizhCamp')
    expect(wrapper.text()).toContain('Alice Martin')
  })

  it('shows a Supprimer button for an active talk, not Restaurer', () => {
    const wrapper = mount(AdminTalksSection, { props: { talks: [activeTalk] } })

    expect(wrapper.text()).toContain('Supprimer')
    expect(wrapper.text()).not.toContain('Restaurer')
  })

  it('shows a Restaurer button for a deleted talk, not Supprimer', () => {
    const wrapper = mount(AdminTalksSection, { props: { talks: [deletedTalk] } })

    expect(wrapper.text()).toContain('Restaurer')
    expect(wrapper.text()).not.toContain('Supprimer')
  })

  it('emits delete after the user confirms', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const wrapper = mount(AdminTalksSection, { props: { talks: [activeTalk] } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[activeTalk]])
  })

  it('does not emit delete when the user cancels the confirmation', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = mount(AdminTalksSection, { props: { talks: [activeTalk] } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('emits restore when the restore button is clicked', async () => {
    const wrapper = mount(AdminTalksSection, { props: { talks: [deletedTalk] } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('restore')).toEqual([[deletedTalk]])
  })

  it('shows a placeholder when there are no talks', () => {
    const wrapper = mount(AdminTalksSection, { props: { talks: [] } })

    expect(wrapper.text()).toContain('Aucun talk')
  })
})
