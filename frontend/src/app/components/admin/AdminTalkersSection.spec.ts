// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminTalkersSection from './AdminTalkersSection.vue'
import type { Talker } from '../../../domain/admin/Talker'

const talkers: Talker[] = [
  { firstname: 'Julien', lastname: 'Topcu', company: 'Shodo', city: null, active: true },
  { firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes', city: 'Rennes', active: false },
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
    const withLegacyCity: Talker[] = [
      { firstname: 'Bob', lastname: 'Dupont', company: 'Shodo', city: 'Marseille', active: true },
    ]
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

  it('pre-checks the "a quitté Shodo" box for an inactive talker', () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('emits updateActive with active=false when the box is checked', async () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)

    expect(wrapper.emitted('updateActive')).toEqual([[talkers[0], false]])
  })

  it('emits updateActive with active=true when the box is unchecked', async () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    await wrapper.findAll('input[type="checkbox"]')[1].setValue(false)

    expect(wrapper.emitted('updateActive')).toEqual([[talkers[1], true]])
  })

  it('lists every known city with a delete button', () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    expect(wrapper.text()).toContain('Villes connues')
    expect(wrapper.text()).toContain('Lyon')
    expect(wrapper.text()).toContain('Rennes')
  })

  it('emits deleteCity after confirming', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    const deleteButton = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'Supprimer la ville Lyon')!
    await deleteButton.trigger('click')

    expect(wrapper.emitted('deleteCity')).toEqual([['Lyon']])
  })

  it('does not emit deleteCity when the confirmation is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = mount(AdminTalkersSection, { props: { talkers, cities } })

    const deleteButton = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'Supprimer la ville Lyon')!
    await deleteButton.trigger('click')

    expect(wrapper.emitted('deleteCity')).toBeUndefined()
  })
})
