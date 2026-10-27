// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminDraftStatusSection from './AdminDraftStatusSection.vue'
import type { Talk } from '../../../domain/talks/Talk'

const draftTalk: Talk = {
  id: 'talk-1',
  conference: { name: 'Conférence non précisée' },
  speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
  title: 'Idée de talk',
  status: 'Idée',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AdminDraftStatusSection', () => {
  it('renders one item per talk with title, conference and speakers', () => {
    const wrapper = mount(AdminDraftStatusSection, { props: { talks: [draftTalk] } })

    expect(wrapper.text()).toContain('Idée de talk')
    expect(wrapper.text()).toContain('Conférence non précisée')
    expect(wrapper.text()).toContain('Alice Martin')
  })

  it('emits validate when the Valider button is clicked', async () => {
    const wrapper = mount(AdminDraftStatusSection, { props: { talks: [draftTalk] } })

    const validateButton = wrapper.findAll('button').find((b) => b.text() === 'Valider')!
    await validateButton.trigger('click')

    expect(wrapper.emitted('validate')).toEqual([[draftTalk]])
  })

  it('emits delete after the user confirms', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const wrapper = mount(AdminDraftStatusSection, { props: { talks: [draftTalk] } })

    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Supprimer')!
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[draftTalk]])
  })

  it('does not emit delete when the user cancels the confirmation', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = mount(AdminDraftStatusSection, { props: { talks: [draftTalk] } })

    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Supprimer')!
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('shows a placeholder when there are no talks', () => {
    const wrapper = mount(AdminDraftStatusSection, { props: { talks: [] } })

    expect(wrapper.text()).toContain('Aucun talk dans cet état')
  })
})
