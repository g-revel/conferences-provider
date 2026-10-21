// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminUndatedSection from './AdminUndatedSection.vue'
import type { Talk } from '../../../domain/talks/Talk'

const talk: Talk = {
  id: 'talk-1',
  conference: { name: 'BreizhCamp' },
  speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
  title: 'Intro TDD',
}

describe('AdminUndatedSection', () => {
  it('renders one item per talk with title, conference and speakers', () => {
    const wrapper = mount(AdminUndatedSection, { props: { talks: [talk] } })

    expect(wrapper.text()).toContain('Intro TDD')
    expect(wrapper.text()).toContain('BreizhCamp')
    expect(wrapper.text()).toContain('Alice Martin')
  })

  it('emits setYear with the entered year when Enregistrer is clicked', async () => {
    const wrapper = mount(AdminUndatedSection, { props: { talks: [talk] } })

    await wrapper.find('input').setValue('2025')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('setYear')).toEqual([[talk, 2025]])
  })

  it('does not emit setYear when the input is empty', async () => {
    const wrapper = mount(AdminUndatedSection, { props: { talks: [talk] } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('setYear')).toBeUndefined()
  })

  it('does not emit setYear for a non-integer or out-of-range value', async () => {
    const wrapper = mount(AdminUndatedSection, { props: { talks: [talk] } })

    await wrapper.find('input').setValue('18')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('setYear')).toBeUndefined()
  })

  it('shows a placeholder when there are no talks', () => {
    const wrapper = mount(AdminUndatedSection, { props: { talks: [] } })

    expect(wrapper.text()).toContain('Aucun talk sans année')
  })
})
