// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TalkListComponent from './TalkListComponent.vue'
import type { Talk } from '../../../domain/talks/Talk'

const talks: Talk[] = [
  {
    conference: { name: 'BreizhCamp', url: 'https://www.breizhcamp.org/programme' },
    speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
    title: 'Intro TDD',
  },
  {
    conference: { name: 'SnowCamp', url: null },
    speakers: [{ firstname: 'Bob', lastname: 'Dupont', company: 'Shodo' }],
    title: null,
  },
  {
    conference: { name: 'MixIT', url: 'https://mixitconf.org/schedule' },
    speakers: [
      { firstname: 'Carol', lastname: 'Lenoir', company: 'Shodo' },
      { firstname: 'Dan', lastname: 'Petit', company: 'Shodo' },
    ],
    title: 'Talk co-animé',
  },
  {
    conference: { name: 'DevFest Nantes', url: 'https://devfest.gdgnantes.com' },
    speakers: [{ firstname: 'Eve', lastname: 'Durand', company: 'Shodo' }],
    title: 'Talk avec vidéo',
    videoUrl: 'https://www.youtube.com/watch?v=abc123',
  },
  {
    conference: { name: 'Sunny Tech', url: null },
    speakers: [{ firstname: 'Finn', lastname: 'Roche', company: 'Shodo' }],
    title: 'Talk catégorisé',
    category: 'Sécurité',
  },
]

describe('TalkListComponent', () => {
  it('should render one item per talk', () => {
    const wrapper = mount(TalkListComponent, { props: { talks } })

    expect(wrapper.findAll('li')).toHaveLength(5)
  })

  it('should render a clickable link to the conference when a url is known', () => {
    const wrapper = mount(TalkListComponent, { props: { talks } })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://www.breizhcamp.org/programme')
    expect(link.text()).toBe('BreizhCamp')
  })

  it('should render the conference name as plain text when no url is known', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[1]] } })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('SnowCamp')
  })

  it('should display the speaker name and talk title', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[0]] } })

    expect(wrapper.text()).toContain('Alice Martin')
    expect(wrapper.text()).toContain('Intro TDD')
  })

  it('should display every co-presenter of a co-animated talk as a single item', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[2]] } })

    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Carol Lenoir, Dan Petit')
    expect(wrapper.text()).toContain('Talk co-animé')
  })

  it('should render a clickable link to the video when a videoUrl is known', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[3]] } })

    const links = wrapper.findAll('a')
    const videoLink = links.find((link) => link.text().includes('Vidéo'))
    expect(videoLink).toBeDefined()
    expect(videoLink?.attributes('href')).toBe('https://www.youtube.com/watch?v=abc123')
  })

  it('should not render a video link when no videoUrl is known', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[0]] } })

    expect(wrapper.text()).not.toContain('Vidéo')
  })

  it('should display the category badge when a category is known', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[4]] } })

    expect(wrapper.text()).toContain('Sécurité')
  })

  it('should not display a category badge when no category is known', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [talks[0]] } })

    expect(wrapper.text()).not.toContain('Sécurité')
  })

  it('should render each talk distinctly after a filter update, even when several talks share the same speaker and conference', async () => {
    const topcuAtDevoxx = (title: string): Talk => ({
      conference: { name: 'Devoxx France' },
      speakers: [{ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo' }],
      title,
    })
    const other: Talk = {
      conference: { name: 'BreizhCamp' },
      speakers: [{ firstname: 'Alice', lastname: 'Martin', company: 'Shodo' }],
      title: 'Unrelated talk',
    }
    const fullList = [topcuAtDevoxx('Talk A'), topcuAtDevoxx('Talk B'), topcuAtDevoxx('Talk C'), other]
    const wrapper = mount(TalkListComponent, { props: { talks: fullList } })

    // Simule le filtre par speaker réduisant la liste à un sous-ensemble qui garde
    // PLUSIEURS talks avec la même conférence/speakers (reproduit le bug observé en
    // pratique : filtrer sur "Topcu" faisait apparaître le même intitulé recopié
    // plusieurs fois à la place des intitulés distincts). Si talkKey() n'est pas
    // unique par talk, Vue réconcilie mal les nœuds DOM lors de cette mise à jour.
    await wrapper.setProps({ talks: [topcuAtDevoxx('Talk A'), topcuAtDevoxx('Talk B'), topcuAtDevoxx('Talk C')] })

    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(wrapper.findAll('h2').map((h) => h.text())).toEqual(['Talk A', 'Talk B', 'Talk C'])
  })

  it('should render an empty list when there are no talks', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [] } })

    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
