// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TalkFiltersComponent from './TalkFiltersComponent.vue'

const baseProps = { categories: [] as string[], cities: [] as string[], searchTerm: '', category: '', city: '' }

describe('TalkFiltersComponent', () => {
  it('renders a "Toutes les catégories" option plus one per given category', () => {
    const wrapper = mount(TalkFiltersComponent, {
      props: { ...baseProps, categories: ['Sécurité', 'Architecture & Craft'] },
    })

    const options = wrapper.findAll('select')[0].findAll('option').map((o) => o.text())
    expect(options).toEqual(['Toutes les catégories', 'Sécurité', 'Architecture & Craft'])
  })

  it('renders a "Toutes les villes" option plus one per given city', () => {
    const wrapper = mount(TalkFiltersComponent, {
      props: { ...baseProps, cities: ['Lyon', 'Rennes'] },
    })

    const options = wrapper.findAll('select')[1].findAll('option').map((o) => o.text())
    expect(options).toEqual(['Toutes les villes', 'Lyon', 'Rennes'])
  })

  it('emits an update when the search input changes', async () => {
    const wrapper = mount(TalkFiltersComponent, { props: baseProps })

    await wrapper.find('input').setValue('Topcu')

    expect(wrapper.emitted('update:searchTerm')).toEqual([['Topcu']])
  })

  it('emits an update when the category select changes', async () => {
    const wrapper = mount(TalkFiltersComponent, { props: { ...baseProps, categories: ['Sécurité'] } })

    await wrapper.findAll('select')[0].setValue('Sécurité')

    expect(wrapper.emitted('update:category')).toEqual([['Sécurité']])
  })

  it('emits an update when the city select changes', async () => {
    const wrapper = mount(TalkFiltersComponent, { props: { ...baseProps, cities: ['Rennes'] } })

    await wrapper.findAll('select')[1].setValue('Rennes')

    expect(wrapper.emitted('update:city')).toEqual([['Rennes']])
  })
})
