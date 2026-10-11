// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TalkFiltersComponent from './TalkFiltersComponent.vue'

describe('TalkFiltersComponent', () => {
  it('renders a "Toutes les catégories" option plus one per given category', () => {
    const wrapper = mount(TalkFiltersComponent, {
      props: { categories: ['Sécurité', 'Architecture & Craft'], speakerName: '', category: '' },
    })

    const options = wrapper.findAll('option').map((o) => o.text())
    expect(options).toEqual(['Toutes les catégories', 'Sécurité', 'Architecture & Craft'])
  })

  it('emits an update when the speaker name input changes', async () => {
    const wrapper = mount(TalkFiltersComponent, { props: { categories: [], speakerName: '', category: '' } })

    await wrapper.find('input').setValue('Topcu')

    expect(wrapper.emitted('update:speakerName')).toEqual([['Topcu']])
  })

  it('emits an update when the category select changes', async () => {
    const wrapper = mount(TalkFiltersComponent, {
      props: { categories: ['Sécurité'], speakerName: '', category: '' },
    })

    await wrapper.find('select').setValue('Sécurité')

    expect(wrapper.emitted('update:category')).toEqual([['Sécurité']])
  })
})
