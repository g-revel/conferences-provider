// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminTalkersSection from './AdminTalkersSection.vue'
import type { Talker } from '../../../domain/admin/Talker'

const talkers: Talker[] = [
  { firstname: 'Julien', lastname: 'Topcu', company: 'Shodo', city: null },
  { firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes', city: 'Rennes' },
]
const cities = ['Lyon', 'Rennes']

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AdminTalkersSection', () => {
  it('renders one row per talker with their name and company', () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('Julien Topcu')
    expect(wrapper.text()).toContain('Shodo Rennes')
  })

  it('lists every known city as an option, plus "(aucune)" and "Ajouter une ville..."', () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    const options = wrapper.findAll('select')[0].findAll('option').map((o) => o.text())
    expect(options).toEqual(['(aucune)', 'Lyon', 'Rennes', 'Ajouter une ville...'])
  })

  it("pre-selects the talker's current city", () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    const select = wrapper.findAll('select')[1].element as HTMLSelectElement
    expect(select.value).toBe('Rennes')
  })

  it('keeps a legacy city not in the known list visible as an option', () => {
    const withLegacyCity: Talker[] = [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo', city: 'Marseille' }]
    const wrapper = mount(AdminTalkersSection, { props: { talkers: withLegacyCity, cities } })

    const options = wrapper.find('select').findAll('option').map((o) => o.text())
    expect(options).toContain('Marseille')
  })

  it('emits updateCity with the selected city when Enregistrer is clicked', async () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    await wrapper.findAll('select')[0].setValue('Lyon')
    await wrapper.findAll('button')[0].trigger('click')

    expect(wrapper.emitted('updateCity')).toEqual([[talkers[0], 'Lyon']])
  })

  it('emits addCity and selects the new city when "Ajouter une ville..." is used and confirmed', async () => {
    vi.stubGlobal('prompt', vi.fn(() => 'Bordeaux'))
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    await wrapper.findAll('select')[0].setValue('__add_city__')

    expect(wrapper.emitted('addCity')).toEqual([['Bordeaux']])
    const select = wrapper.findAll('select')[0].element as HTMLSelectElement
    expect(select.value).toBe('Bordeaux')
  })

  it('does not emit addCity when the prompt is cancelled', async () => {
    vi.stubGlobal('prompt', vi.fn(() => null))
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    await wrapper.findAll('select')[0].setValue('__add_city__')

    expect(wrapper.emitted('addCity')).toBeUndefined()
  })
})
