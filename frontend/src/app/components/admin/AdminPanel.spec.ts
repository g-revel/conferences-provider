// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import AdminPanel from './AdminPanel.vue'
import { adminClientKey } from '../../injectionKeys'
import type { IAdminClient } from '../../../infrastructure/IAdminClient'
import type { Talker } from '../../../domain/admin/Talker'
import type { Talk } from '../../../domain/talks/Talk'

const talkers: Talker[] = [{ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo', city: null }]
const activeTalk: Talk = {
  id: 'talk-1',
  conference: { name: 'BreizhCamp' },
  speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
  title: 'Intro TDD',
}
const deletedTalk: Talk = {
  id: 'talk-2',
  conference: { name: 'MixIT' },
  speakers: [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo' }],
  title: 'Supprimé',
  deletedAt: '2026-01-01T00:00:00.000Z',
}

function mountPanel(client: IAdminClient) {
  return mount(AdminPanel, {
    props: { password: 'Shodo' },
    global: { provide: { [adminClientKey as symbol]: client } },
  })
}

function fakeClient(overrides: Partial<IAdminClient> = {}): IAdminClient {
  return {
    login: vi.fn(async () => true),
    getTalkers: vi.fn(async () => talkers),
    setTalkerCity: vi.fn(async () => {}),
    getAllTalks: vi.fn(async () => [activeTalk, deletedTalk]),
    deleteTalk: vi.fn(async () => {}),
    restoreTalk: vi.fn(async () => {}),
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('confirm', vi.fn(() => true))
})

describe('AdminPanel', () => {
  it('loads and displays talkers on the default tab', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    expect(wrapper.text()).toContain('Julien Topcu')
    expect(wrapper.text()).toContain('Talkers (1)')
  })

  it('shows separate counts for active talks and the trash', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    expect(wrapper.text()).toContain('Talks (1)')
    expect(wrapper.text()).toContain('Corbeille (1)')
  })

  it('switches to the talks tab and shows active vs deleted talks separately', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    const talksTabButton = wrapper.findAll('button').find((b) => b.text().includes('Talks ('))!
    await talksTabButton.trigger('click')

    expect(wrapper.text()).toContain('Intro TDD')
    expect(wrapper.text()).toContain('Supprimé')
  })

  it('calls setTalkerCity and reloads when a city is saved', async () => {
    const client = fakeClient()
    const wrapper = mountPanel(client)
    await flushPromises()

    await wrapper.find('input').setValue('Paris')
    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Enregistrer')!
    await saveButton.trigger('click')
    await flushPromises()

    expect(client.setTalkerCity).toHaveBeenCalledWith('Shodo', 'Julien', 'Topcu', 'Paris')
    expect(client.getTalkers).toHaveBeenCalledTimes(2) // initial load + reload after save
  })

  it('calls deleteTalk when confirming deletion of an active talk', async () => {
    const client = fakeClient()
    const wrapper = mountPanel(client)
    await flushPromises()

    const talksTabButton = wrapper.findAll('button').find((b) => b.text().includes('Talks ('))!
    await talksTabButton.trigger('click')
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Supprimer')!
    await deleteButton.trigger('click')
    await flushPromises()

    expect(client.deleteTalk).toHaveBeenCalledWith('Shodo', 'talk-1')
  })

  it('calls restoreTalk when clicking restore on a deleted talk', async () => {
    const client = fakeClient()
    const wrapper = mountPanel(client)
    await flushPromises()

    const talksTabButton = wrapper.findAll('button').find((b) => b.text().includes('Talks ('))!
    await talksTabButton.trigger('click')
    const restoreButton = wrapper.findAll('button').find((b) => b.text() === 'Restaurer')!
    await restoreButton.trigger('click')
    await flushPromises()

    expect(client.restoreTalk).toHaveBeenCalledWith('Shodo', 'talk-2')
  })

  it('emits close when "Retour au site" is clicked', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    const closeButton = wrapper.findAll('button').find((b) => b.text() === 'Retour au site')!
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
