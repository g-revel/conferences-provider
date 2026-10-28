// Les URLs stockées sont les URLs "watch" classiques (voir backend/CLAUDE.md), pas des URLs
// d'embed : il faut les convertir pour pouvoir les mettre dans un <iframe>.
export function getYoutubeEmbedUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null

  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }

  if (url.hostname === 'youtu.be') {
    const id = url.pathname.slice(1)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }

  if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.pathname.startsWith('/embed/')) {
      return videoUrl
    }
  }

  return null
}
