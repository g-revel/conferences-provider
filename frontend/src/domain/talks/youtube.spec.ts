import { describe, expect, it } from 'vitest'
import { getYoutubeEmbedUrl } from './youtube'

describe('getYoutubeEmbedUrl', () => {
  it('converts a standard watch URL to an embed URL', () => {
    expect(getYoutubeEmbedUrl('https://www.youtube.com/watch?v=1JA3wPw7dsw')).toBe(
      'https://www.youtube.com/embed/1JA3wPw7dsw',
    )
  })

  it('converts a shortened youtu.be URL to an embed URL', () => {
    expect(getYoutubeEmbedUrl('https://youtu.be/1JA3wPw7dsw')).toBe(
      'https://www.youtube.com/embed/1JA3wPw7dsw',
    )
  })

  it('keeps a watch URL with extra query params working', () => {
    expect(getYoutubeEmbedUrl('https://www.youtube.com/watch?v=1JA3wPw7dsw&t=42s')).toBe(
      'https://www.youtube.com/embed/1JA3wPw7dsw',
    )
  })

  it('returns an already-embed URL unchanged', () => {
    expect(getYoutubeEmbedUrl('https://www.youtube.com/embed/1JA3wPw7dsw')).toBe(
      'https://www.youtube.com/embed/1JA3wPw7dsw',
    )
  })

  it('returns null for a non-YouTube URL', () => {
    expect(getYoutubeEmbedUrl('https://vimeo.com/123456')).toBeNull()
  })

  it('returns null when there is no video URL', () => {
    expect(getYoutubeEmbedUrl(null)).toBeNull()
    expect(getYoutubeEmbedUrl(undefined)).toBeNull()
  })

  it('returns null for an invalid URL', () => {
    expect(getYoutubeEmbedUrl('not a url')).toBeNull()
  })
})
