// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminPendingValidationSection from './AdminPendingValidationSection.vue'
import type { Talk } from '../../../domain/talks/Talk'

const withCandidate: Talk = {
  id: 'talk-1',
  conference: { name: 'BreizhCamp' },
  speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
  title: 'Intro TDD',
  pendingVideoUrl: 'https://www.youtube.com/watch?v=candidate',
}
const withoutCandidate: Talk = {
  id: 'talk-2',
  conference: { name: 'MixIT' },
  speakers: [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo' }],
  title: 'Sans candidat',
}

describe('AdminPendingValidationSection', () => {
  it('renders one item per talk with title, conference and speakers', () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withCandidate] } })

    expect(wrapper.text()).toContain('Intro TDD')
    expect(wrapper.text()).toContain('BreizhCamp')
    expect(wrapper.text()).toContain('Alice Martin')
  })

  it('shows the proposed candidate link when there is one', () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withCandidate] } })

    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('https://www.youtube.com/watch?v=candidate')
  })

  it('does not show a proposed link when there is none', () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withoutCandidate] } })

    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('pre-fills the input with the candidate link', () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withCandidate] } })

    const input = wrapper.find('input[type="text"]')
    expect((input.element as HTMLInputElement).value).toBe('https://www.youtube.com/watch?v=candidate')
  })

  it('emits validate with the (possibly edited) draft url', async () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withCandidate] } })

    await wrapper.find('input[type="text"]').setValue('https://www.youtube.com/watch?v=edited')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('validate')).toEqual([[withCandidate, 'https://www.youtube.com/watch?v=edited']])
  })

  it('does not emit validate when the draft is empty', async () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withoutCandidate] } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('validate')).toBeUndefined()
  })

  it('emits toggleShowWithoutLink when the checkbox changes', async () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [withoutCandidate] } })

    await wrapper.find('input[type="checkbox"]').setValue(true)

    expect(wrapper.emitted('toggleShowWithoutLink')).toEqual([[withoutCandidate, true]])
  })

  it('shows a placeholder when there are no talks', () => {
    const wrapper = mount(AdminPendingValidationSection, { props: { talks: [] } })

    expect(wrapper.text()).toContain('Aucun talk en attente de validation')
  })
})
