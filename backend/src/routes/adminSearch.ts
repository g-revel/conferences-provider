import { FastifyInstance } from 'fastify'
import { readTalks, writeTalks } from '../data/talksStore.js'
import { readSpeakers } from '../data/speakersStore.js'
import { readConferences } from '../data/conferencesStore.js'
import { Speak } from '../collects/get-speaks/speak.js'
import { findSpeakerTalksOnYoutube } from '../collects/find-speaker-talks-on-youtube/findSpeakerTalksOnYoutube.js'
import { extractSpeaksFromConference } from '../collects/extract-speaks/extract-speaks.js'
import { groupCoPresentedTalks } from '../collects/extract-speaks/groupCoPresentedTalks.js'
import { canonicalizeConferenceName } from '../collects/get-conferences/canonicalizeConferenceName.js'
import { editionUrlsOf } from '../collects/get-conferences/editionUrlsOf.js'
import { mergeSpeaks } from '../collects/get-speaks/mergeSpeaks.js'
import { normalizeForMatch } from '../string.functions.js'

const UNAVAILABLE_MESSAGE =
  'SearXNG/Ollama indisponibles — lance-les en local (voir backend/SETUP.md) pour utiliser cette fonctionnalité.'

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`
}

function titleKey(conferenceName: string, title: string): string {
  return `${conferenceName}|${normalizeForMatch(title)}`
}

// Un candidat retourné par une recherche ciblée ne doit pas redoubler un talk déjà
// connu — comparé sur les mêmes clés d'identité que mergeSpeaks.ts (titre normalisé +
// conférence) et sur le videoUrl, pour ne pas faire perdre de temps à l'admin avec
// un "candidat" qui n'apporte en réalité rien de nouveau.
function buildKnownState(existingTalks: Speak[]): { titleKeys: Set<string>; videoUrls: Set<string> } {
  const titleKeys = new Set<string>()
  const videoUrls = new Set<string>()
  for (const talk of existingTalks) {
    if (talk.title != null) titleKeys.add(titleKey(talk.conference.name, talk.title))
    if (talk.videoUrl) videoUrls.add(talk.videoUrl)
  }
  return { titleKeys, videoUrls }
}

function isNewCandidate(candidate: Speak, known: { titleKeys: Set<string>; videoUrls: Set<string> }): boolean {
  if (candidate.videoUrl && known.videoUrls.has(candidate.videoUrl)) return false
  if (candidate.title != null && known.titleKeys.has(titleKey(candidate.conference.name, candidate.title))) return false
  return true
}

async function pingUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return response.ok
  } catch {
    return false
  }
}

// Enregistré depuis adminRoutes (admin.ts) via app.register(), pas depuis app.ts
// directement : hérite ainsi du hook preHandler de vérification du mot de passe par
// encapsulation Fastify, sans dupliquer la vérification ici.
export default async function adminSearchRoutes(app: FastifyInstance): Promise<void> {
  // Recherche ciblée (un talker OU un événement), déclenchée depuis l'admin, qui ne
  // fonctionne qu'en local : SearXNG/Ollama ne sont pas accessibles depuis le backend
  // déployé sur Render (voir backend/SETUP.md). Les résultats sont retournés tels
  // quels, jamais persistés automatiquement — l'admin les accepte un par un.
  app.get('/api/admin/search/status', async () => {
    const searxngHost = process.env.SEARXNG_HOST ?? 'http://localhost:8080'
    const ollamaHost = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
    const [searxng, ollama] = await Promise.all([
      pingUrl(`${searxngHost}/search?q=test&format=json`),
      pingUrl(`${ollamaHost}/api/tags`),
    ])
    return { searxng, ollama }
  })

  app.get('/api/admin/search/conferences', async () => {
    return readConferences()
  })

  app.post('/api/admin/search/talker', async (request, reply) => {
    const body = (request.body ?? {}) as { firstname?: unknown; lastname?: unknown }
    if (typeof body.firstname !== 'string' || typeof body.lastname !== 'string') {
      return reply.code(400).send({ error: 'firstname and lastname are required' })
    }

    const speakers = await readSpeakers()
    const identity = speakerIdentity(body.firstname, body.lastname)
    const speaker = speakers.find((s) => speakerIdentity(s.firstname, s.lastname) === identity)
    if (!speaker) return reply.code(404).send({ error: 'not found' })

    const [events, existingTalks] = await Promise.all([readConferences(), readTalks()])
    const known = buildKnownState(existingTalks)

    try {
      const found = await findSpeakerTalksOnYoutube(speaker, speakers)
      return groupCoPresentedTalks(found)
        .map((speak) => ({ ...speak, conference: { name: canonicalizeConferenceName(speak.conference.name, events) } }))
        .filter((speak) => isNewCandidate(speak, known))
    } catch (err) {
      app.log.error(err)
      return reply.code(503).send({ error: UNAVAILABLE_MESSAGE })
    }
  })

  app.post('/api/admin/search/event', async (request, reply) => {
    const body = (request.body ?? {}) as { conferenceName?: unknown }
    if (typeof body.conferenceName !== 'string' || body.conferenceName.trim() === '') {
      return reply.code(400).send({ error: 'conferenceName is required' })
    }

    const [events, speakers, existingTalks] = await Promise.all([readConferences(), readSpeakers(), readTalks()])
    const conference = events.find((e) => e.name === body.conferenceName)
    if (!conference) return reply.code(404).send({ error: 'not found' })

    const known = buildKnownState(existingTalks)
    // N'explore que les éditions déjà connues de cet événement (url + pastEditionUrls)
    // — même pattern que scripts/refresh-events-light.ts. Découvrir de *nouvelles*
    // éditions reste le rôle séparé de refresh:events:heavy, pas dupliqué ici.
    const editions = editionUrlsOf(conference).map((url) => ({ name: conference.name, url }))

    try {
      let found: Speak[] = []
      for (const edition of editions) {
        found = found.concat(await extractSpeaksFromConference(edition, speakers))
      }
      return found.filter((speak) => isNewCandidate(speak, known))
    } catch (err) {
      app.log.error(err)
      return reply.code(503).send({ error: UNAVAILABLE_MESSAGE })
    }
  })

  // Le candidat accepté est fusionné avec l'identité d'un talk déjà connu s'il y en a
  // une (mergeSpeaks.ts, même logique que les scripts batch) plutôt qu'inséré en
  // aveugle — réécrit le tableau complet des talks, acceptable ici : action rare et
  // déjà tolérante à la lenteur (comme refresh:events:light/refresh:speakers:youtube).
  app.post('/api/admin/search/accept', async (request, reply) => {
    const body = (request.body ?? {}) as { talk?: Speak }
    if (!body.talk || typeof body.talk !== 'object') {
      return reply.code(400).send({ error: 'talk is required' })
    }

    const existingTalks = await readTalks()
    await writeTalks(mergeSpeaks(existingTalks, [body.talk]))
    return { success: true }
  })
}
