// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TalkDetailModal from './TalkDetailModal.vue'
import type { Talk } from '../../../domain/talks/Talk'

const fullTalk: Talk = {
  conference: { name: 'MixIT', url: 'https://mixitconf.org/2025' },
  speakers: [{ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo' }],
  title: 'Le pattern Hive',
  videoUrl: 'https://www.youtube.com/watch?v=abc123',
  categories: ['Architecture & Craft', 'IA'],
  format: 'Conférence (40-50min)',
  level: 'Intermédiaire',
  language: 'Français',
  slidesUrl: 'https://slides.com/julientopcu/hive',
  description: 'Une description détaillée du talk.',
}

describe('TalkDetailModal', () => {
  it('displays the title, speakers and all the rich metadata', () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    expect(wrapper.text()).toContain('Le pattern Hive')
    expect(wrapper.text()).toContain('Julien Topcu')
    expect(wrapper.text()).toContain('Architecture & Craft')
    expect(wrapper.text()).toContain('IA')
    expect(wrapper.text()).toContain('Conférence (40-50min)')
    expect(wrapper.text()).toContain('Intermédiaire')
    expect(wrapper.text()).toContain('Français')
    expect(wrapper.text()).toContain('Une description détaillée du talk.')
  })

  it('renders links to the conference and the slides', () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('https://mixitconf.org/2025')
    expect(hrefs).toContain('https://slides.com/julientopcu/hive')
  })

  it('embeds a YouTube player instead of a raw link when the video is on YouTube', () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    expect(wrapper.find('a[href="https://www.youtube.com/watch?v=abc123"]').exists()).toBe(false)
    expect(wrapper.find('iframe').attributes('src')).toBe('https://www.youtube.com/embed/abc123')
  })

  it('falls back to a raw link when the video is not on YouTube', () => {
    const talkWithNonYoutubeVideo: Talk = { ...fullTalk, videoUrl: 'https://vimeo.com/123456' }
    const wrapper = mount(TalkDetailModal, { props: { talk: talkWithNonYoutubeVideo } })

    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('a[href="https://vimeo.com/123456"]').exists()).toBe(true)
  })

  it("displays the speaker's city when determinable", () => {
    const talkFromRennes: Talk = { ...fullTalk, speakers: [{ firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes' }] }
    const wrapper = mount(TalkDetailModal, { props: { talk: talkFromRennes } })

    expect(wrapper.text()).toContain('Rennes')
  })

  it('does not render optional fields that are absent', () => {
    const minimalTalk: Talk = {
      conference: { name: 'BreizhCamp' },
      speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
      title: 'Intro TDD',
    }
    const wrapper = mount(TalkDetailModal, { props: { talk: minimalTalk } })

    expect(wrapper.findAll('a')).toHaveLength(0)
  })

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    await wrapper.find('.fixed').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit close when clicking inside the modal content', async () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    await wrapper.find('h2').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits filterSpeaker with the full name when a speaker is clicked', async () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    const speakerButton = wrapper.findAll('button').find((b) => b.text() === 'Julien Topcu')!
    await speakerButton.trigger('click')

    expect(wrapper.emitted('filterSpeaker')).toEqual([['Julien Topcu']])
  })

  it('emits filterCategory with the clicked category', async () => {
    const wrapper = mount(TalkDetailModal, { props: { talk: fullTalk } })

    const categoryButton = wrapper.findAll('button').find((b) => b.text() === 'IA')!
    await categoryButton.trigger('click')

    expect(wrapper.emitted('filterCategory')).toEqual([['IA']])
  })
})
