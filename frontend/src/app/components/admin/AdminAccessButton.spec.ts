// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminAccessButton from './AdminAccessButton.vue'

describe('AdminAccessButton', () => {
  it('emits click when clicked', async () => {
    const wrapper = mount(AdminAccessButton)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
