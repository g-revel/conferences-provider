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
]

describe('TalkListComponent', () => {
  it('should render one item per talk', () => {
    const wrapper = mount(TalkListComponent, { props: { talks } })

    expect(wrapper.findAll('li')).toHaveLength(3)
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

  it('should render an empty list when there are no talks', () => {
    const wrapper = mount(TalkListComponent, { props: { talks: [] } })

    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
