// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminTalkersSection from './AdminTalkersSection.vue'
import type { Talker } from '../../../domain/admin/Talker'

const talkers: Talker[] = [
  { firstname: 'Julien', lastname: 'Topcu', company: 'Shodo', city: null },
  { firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes', city: 'Rennes' },
]

describe('AdminTalkersSection', () => {
  it('renders one row per talker with their name and company', () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers } })

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('Julien Topcu')
    expect(wrapper.text()).toContain('Shodo Rennes')
  })

  it("pre-fills the city input with the talker's current city", () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers } })

    const inputs = wrapper.findAll('input')
    expect((inputs[1].element as HTMLInputElement).value).toBe('Rennes')
  })

  it('emits updateCity with the edited value when Enregistrer is clicked', async () => {
    const wrapper = mount(AdminTalkersSection, { props: { talkers } })

    await wrapper.findAll('input')[0].setValue('Paris')
    await wrapper.findAll('button')[0].trigger('click')

    expect(wrapper.emitted('updateCity')).toEqual([[talkers[0], 'Paris']])
  })
})
