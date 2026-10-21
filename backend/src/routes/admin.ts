import { FastifyInstance } from 'fastify'
import { readJson, writeJson } from '../data/jsonStore.js'
import { TALKS_PATH, SPEAKER_CITY_OVERRIDES_PATH, SPEAKERS_PATH } from '../data/paths.js'
import { Speak } from '../collects/get-speaks/speak.js'
import { Speaker } from '../collects/get-all-speakers/speaker.js'
import { SpeakerCityOverride } from '../collects/get-all-speakers/speakerCityOverride.js'
import { applyCityOverrides } from '../collects/get-speaks/applyCityOverrides.js'
import { applySpeakerActiveStatus } from '../collects/get-speaks/applySpeakerActiveStatus.js'
import { isValidAdminPassword } from '../admin/adminAuth.js'
import { normalizeForMatch } from '../string.functions.js'

function speakerIdentity(firstname: string, lastname: string): string {
  return `${normalizeForMatch(firstname)}|${normalizeForMatch(lastname)}`
}

function uniqueTalkers(talks: Speak[]): Speaker[] {
  const byIdentity = new Map<string, Speaker>()
  for (const talk of talks) {
    for (const speaker of talk.speakers) {
      const identity = speakerIdentity(speaker.firstname, speaker.lastname)
      if (!byIdentity.has(identity)) byIdentity.set(identity, speaker)
    }
  }
  return [...byIdentity.values()].sort((a, b) =>
    `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`),
  )
}

// Pas de fp() ici volontairement : on a besoin du hook preHandler scopé à CE
// plugin (le vrai cloisonnement Fastify, pas la sortie d'encapsulation de
// fastify-plugin) pour que la vérification de mot de passe ne s'applique qu'aux
// routes /api/admin/*, sans toucher /api/talks ni /health.
export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (request, reply) => {
    if (request.url === '/api/admin/login') return
    if (!isValidAdminPassword(request.headers['x-admin-password'])) {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  app.post('/api/admin/login', async (request, reply) => {
    const { password } = (request.body ?? {}) as { password?: unknown }
    if (!isValidAdminPassword(password)) return reply.code(401).send({ valid: false })
    return { valid: true }
  })

  app.get('/api/admin/talkers', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const overrideByIdentity = new Map(overrides.map((o) => [speakerIdentity(o.firstname, o.lastname), o.city]))

    return uniqueTalkers(talks).map((speaker) => ({
      firstname: speaker.firstname,
      lastname: speaker.lastname,
      company: speaker.company,
      city: overrideByIdentity.get(speakerIdentity(speaker.firstname, speaker.lastname)) ?? null,
    }))
  })

  app.put('/api/admin/talkers/city', async (request, reply) => {
    const body = (request.body ?? {}) as { firstname?: unknown; lastname?: unknown; city?: unknown }
    if (typeof body.firstname !== 'string' || typeof body.lastname !== 'string') {
      return reply.code(400).send({ error: 'firstname and lastname are required' })
    }
    const city = typeof body.city === 'string' && body.city.trim() !== '' ? body.city.trim() : null

    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const identity = speakerIdentity(body.firstname, body.lastname)
    const next = overrides.filter((o) => speakerIdentity(o.firstname, o.lastname) !== identity)
    next.push({ firstname: body.firstname, lastname: body.lastname, city })
    await writeJson(SPEAKER_CITY_OVERRIDES_PATH, next)

    return { firstname: body.firstname, lastname: body.lastname, city }
  })

  // Contrairement à GET /api/talks (public), inclut les talks sans titre et
  // supprimés — c'est la vue admin, pas le portail.
  app.get('/api/admin/talks', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, [])
    return applySpeakerActiveStatus(applyCityOverrides(talks, overrides), speakers)
  })

  app.delete('/api/admin/talks/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const index = talks.findIndex((t) => t.id === id)
    if (index === -1) return reply.code(404).send({ error: 'not found' })

    talks[index] = { ...talks[index], deletedAt: new Date().toISOString() }
    await writeJson(TALKS_PATH, talks)
    return talks[index]
  })

  app.post('/api/admin/talks/:id/restore', async (request, reply) => {
    const { id } = request.params as { id: string }
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const index = talks.findIndex((t) => t.id === id)
    if (index === -1) return reply.code(404).send({ error: 'not found' })

    talks[index] = { ...talks[index], deletedAt: null }
    await writeJson(TALKS_PATH, talks)
    return talks[index]
  })

  // Valide un lien (candidat proposé automatiquement ou saisi à la main par
  // l'admin) : devient le videoUrl public du talk. `pendingVideoUrl` est purgé —
  // une fois validé, le candidat n'a plus de raison d'être affiché à part.
  app.put('/api/admin/talks/:id/video-url', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as { videoUrl?: unknown }
    if (typeof body.videoUrl !== 'string' || body.videoUrl.trim() === '') {
      return reply.code(400).send({ error: 'videoUrl is required' })
    }

    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const index = talks.findIndex((t) => t.id === id)
    if (index === -1) return reply.code(404).send({ error: 'not found' })

    talks[index] = { ...talks[index], videoUrl: body.videoUrl.trim(), pendingVideoUrl: null }
    await writeJson(TALKS_PATH, talks)
    return talks[index]
  })

  // Override admin pour un talk sans lien connu : l'afficher quand même côté
  // public plutôt que d'attendre un lien qui n'existera peut-être jamais.
  app.put('/api/admin/talks/:id/show-without-link', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as { showWithoutLink?: unknown }
    if (typeof body.showWithoutLink !== 'boolean') {
      return reply.code(400).send({ error: 'showWithoutLink must be a boolean' })
    }

    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const index = talks.findIndex((t) => t.id === id)
    if (index === -1) return reply.code(404).send({ error: 'not found' })

    talks[index] = { ...talks[index], showWithoutLink: body.showWithoutLink }
    await writeJson(TALKS_PATH, talks)
    return talks[index]
  })
}
