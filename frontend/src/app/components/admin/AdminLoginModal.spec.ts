// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminLoginModal from './AdminLoginModal.vue'

describe('AdminLoginModal', () => {
  it('emits submit with the entered password', async () => {
    const wrapper = mount(AdminLoginModal)

    await wrapper.find('input').setValue('Shodo')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([['Shodo']])
  })

  it('shows an error message when error is true', () => {
    const wrapper = mount(AdminLoginModal, { props: { error: true } })

    expect(wrapper.text()).toContain('incorrect')
  })

  it('does not show an error message by default', () => {
    const wrapper = mount(AdminLoginModal)

    expect(wrapper.text()).not.toContain('incorrect')
  })

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mount(AdminLoginModal)

    await wrapper.find('button[type="button"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mount(AdminLoginModal)

    await wrapper.find('.fixed').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
