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
  videoUrl: 'https://www.youtube.com/watch?v=abc123',
}
const deletedTalk: Talk = {
  id: 'talk-2',
  conference: { name: 'MixIT' },
  speakers: [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo' }],
  title: 'Supprimé',
  deletedAt: '2026-01-01T00:00:00.000Z',
}
const pendingTalk: Talk = {
  id: 'talk-3',
  conference: { name: 'DevFest' },
  speakers: [{ firstname: 'Carol', lastname: 'Lenoir', company: 'Shodo' }],
  title: 'Sans lien',
  pendingVideoUrl: 'https://www.youtube.com/watch?v=candidate',
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
    getAllTalks: vi.fn(async () => [activeTalk, deletedTalk, pendingTalk]),
    deleteTalk: vi.fn(async () => {}),
    restoreTalk: vi.fn(async () => {}),
    setTalkVideoUrl: vi.fn(async () => {}),
    setTalkShowWithoutLink: vi.fn(async () => {}),
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

    expect(wrapper.text()).toContain('Talks (2)')
    expect(wrapper.text()).toContain('Corbeille (1)')
  })

  it('switches to the talks tab and shows only active talks', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    const talksTabButton = wrapper.findAll('button').find((b) => b.text().includes('Talks ('))!
    await talksTabButton.trigger('click')

    expect(wrapper.text()).toContain('Intro TDD')
    expect(wrapper.text()).not.toContain('Supprimé')
  })

  it('switches to the trash tab and shows only deleted talks', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    const trashTabButton = wrapper.findAll('button').find((b) => b.text().includes('Corbeille ('))!
    await trashTabButton.trigger('click')

    expect(wrapper.text()).toContain('Supprimé')
    expect(wrapper.text()).not.toContain('Intro TDD')
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

    const trashTabButton = wrapper.findAll('button').find((b) => b.text().includes('Corbeille ('))!
    await trashTabButton.trigger('click')
    const restoreButton = wrapper.findAll('button').find((b) => b.text() === 'Restaurer')!
    await restoreButton.trigger('click')
    await flushPromises()

    expect(client.restoreTalk).toHaveBeenCalledWith('Shodo', 'talk-2')
  })

  it('shows the pending-validation count and lists talks without a videoUrl', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    expect(wrapper.text()).toContain('À valider (1)')

    const pendingTabButton = wrapper.findAll('button').find((b) => b.text().includes('À valider'))!
    await pendingTabButton.trigger('click')

    expect(wrapper.text()).toContain('Sans lien')
    expect(wrapper.text()).not.toContain('Intro TDD')
  })

  it('calls setTalkVideoUrl with the edited draft when validating a pending talk', async () => {
    const client = fakeClient()
    const wrapper = mountPanel(client)
    await flushPromises()

    const pendingTabButton = wrapper.findAll('button').find((b) => b.text().includes('À valider'))!
    await pendingTabButton.trigger('click')

    await wrapper.find('input[type="text"]').setValue('https://www.youtube.com/watch?v=validated')
    const validateButton = wrapper.findAll('button').find((b) => b.text() === 'Valider')!
    await validateButton.trigger('click')
    await flushPromises()

    expect(client.setTalkVideoUrl).toHaveBeenCalledWith('Shodo', 'talk-3', 'https://www.youtube.com/watch?v=validated')
  })

  it('calls deleteTalk when deleting a pending talk from the "À valider" tab', async () => {
    const client = fakeClient()
    const wrapper = mountPanel(client)
    await flushPromises()

    const pendingTabButton = wrapper.findAll('button').find((b) => b.text().includes('À valider'))!
    await pendingTabButton.trigger('click')
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Supprimer')!
    await deleteButton.trigger('click')
    await flushPromises()

    expect(client.deleteTalk).toHaveBeenCalledWith('Shodo', 'talk-3')
  })

  it('calls setTalkShowWithoutLink when the checkbox is toggled', async () => {
    const client = fakeClient()
    const wrapper = mountPanel(client)
    await flushPromises()

    const pendingTabButton = wrapper.findAll('button').find((b) => b.text().includes('À valider'))!
    await pendingTabButton.trigger('click')

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    await flushPromises()

    expect(client.setTalkShowWithoutLink).toHaveBeenCalledWith('Shodo', 'talk-3', true)
  })

  it('emits close when "Retour au site" is clicked', async () => {
    const wrapper = mountPanel(fakeClient())
    await flushPromises()

    const closeButton = wrapper.findAll('button').find((b) => b.text() === 'Retour au site')!
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
