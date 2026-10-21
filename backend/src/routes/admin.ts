import { FastifyInstance } from 'fastify'
import { readJson, writeJson } from '../data/jsonStore.js'
import { TALKS_PATH, SPEAKER_CITY_OVERRIDES_PATH, SPEAKER_MEMBER_OVERRIDES_PATH, SPEAKERS_PATH, KNOWN_CITIES_PATH } from '../data/paths.js'
import { Speak } from '../collects/get-speaks/speak.js'
import { Speaker } from '../collects/get-all-speakers/speaker.js'
import { SpeakerCityOverride } from '../collects/get-all-speakers/speakerCityOverride.js'
import { SpeakerMemberOverride } from '../collects/get-all-speakers/speakerMemberOverride.js'
import { applyCityOverrides } from '../collects/get-speaks/applyCityOverrides.js'
import { applySpeakerActiveStatus } from '../collects/get-speaks/applySpeakerActiveStatus.js'
import { applyMemberOverrides } from '../collects/get-speaks/applyMemberOverrides.js'
import { extractCityFromCompany } from '../collects/get-all-speakers/extractCityFromCompany.js'
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
    const memberOverrides = await readJson<SpeakerMemberOverride[]>(SPEAKER_MEMBER_OVERRIDES_PATH, [])
    const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, [])
    const overrideByIdentity = new Map(overrides.map((o) => [speakerIdentity(o.firstname, o.lastname), o.city]))
    const memberOverrideByIdentity = new Map(
      memberOverrides.map((o) => [speakerIdentity(o.firstname, o.lastname), o.active]),
    )
    const activeByIdentity = new Map(speakers.map((s) => [speakerIdentity(s.firstname, s.lastname), s.active]))

    // La ville "effective" d'un talker, comme déjà affichée côté portail (voir
    // frontend/src/domain/speakers/SpeakerCity.ts) : l'override admin s'il existe
    // (y compris explicitement `null`, pour forcer "(aucune)" malgré une ville
    // dérivable), sinon celle dérivée de `company`. `has()` et pas juste `??` :
    // un override à `null` ne doit pas retomber sur la dérivation automatique.
    return uniqueTalkers(talks).map((speaker) => {
      const identity = speakerIdentity(speaker.firstname, speaker.lastname)
      const city = overrideByIdentity.has(identity)
        ? (overrideByIdentity.get(identity) ?? null)
        : extractCityFromCompany(speaker.company)
      // Même logique pour `active` : l'override manuel gagne s'il existe, sinon la
      // valeur dérivée de Slack (speakers.json), par défaut `true` si inconnue de
      // speakers.json (ex. talk importé depuis Notion sans contrepartie Slack).
      const active = memberOverrideByIdentity.has(identity)
        ? (memberOverrideByIdentity.get(identity) as boolean)
        : (activeByIdentity.get(identity) ?? true)

      return { firstname: speaker.firstname, lastname: speaker.lastname, company: speaker.company, city, active }
    })
  })

  // Liste statique (pas dérivée de `company`) des villes proposables dans le
  // sélecteur admin — git-trackée dans data/known-cities.json, pérenne et
  // partagée par tous les admins dès qu'une ville y est ajoutée.
  app.get('/api/admin/cities', async () => {
    const cities = await readJson<string[]>(KNOWN_CITIES_PATH, [])
    return [...cities].sort((a, b) => a.localeCompare(b))
  })

  app.post('/api/admin/cities', async (request, reply) => {
    const body = (request.body ?? {}) as { city?: unknown }
    if (typeof body.city !== 'string' || body.city.trim() === '') {
      return reply.code(400).send({ error: 'city is required' })
    }
    const city = body.city.trim()

    const cities = await readJson<string[]>(KNOWN_CITIES_PATH, [])
    const alreadyKnown = cities.some((c) => normalizeForMatch(c) === normalizeForMatch(city))
    const next = alreadyKnown ? cities : [...cities, city]
    if (!alreadyKnown) await writeJson(KNOWN_CITIES_PATH, next)

    return [...next].sort((a, b) => a.localeCompare(b))
  })

  // Corrige une ville mal saisie (typo) sans attendre une intervention manuelle
  // sur les données — ne touche pas les overrides déjà assignés à cette valeur
  // (un talker gardant une ville supprimée de la liste reste visible comme
  // option "legacy" côté select, voir AdminTalkersSection.vue).
  app.delete('/api/admin/cities', async (request, reply) => {
    const body = (request.body ?? {}) as { city?: unknown }
    if (typeof body.city !== 'string' || body.city.trim() === '') {
      return reply.code(400).send({ error: 'city is required' })
    }

    const cities = await readJson<string[]>(KNOWN_CITIES_PATH, [])
    const next = cities.filter((c) => normalizeForMatch(c) !== normalizeForMatch(body.city as string))
    await writeJson(KNOWN_CITIES_PATH, next)

    return [...next].sort((a, b) => a.localeCompare(b))
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

  // Override admin pour marquer manuellement qu'un membre n'appartient plus à
  // Shodo (ou l'y restaurer) — indépendant du statut `deleted` Slack, voir
  // applyMemberOverrides.ts.
  app.put('/api/admin/talkers/active', async (request, reply) => {
    const body = (request.body ?? {}) as { firstname?: unknown; lastname?: unknown; active?: unknown }
    if (typeof body.firstname !== 'string' || typeof body.lastname !== 'string' || typeof body.active !== 'boolean') {
      return reply.code(400).send({ error: 'firstname, lastname and active are required' })
    }

    const overrides = await readJson<SpeakerMemberOverride[]>(SPEAKER_MEMBER_OVERRIDES_PATH, [])
    const identity = speakerIdentity(body.firstname, body.lastname)
    const next = overrides.filter((o) => speakerIdentity(o.firstname, o.lastname) !== identity)
    next.push({ firstname: body.firstname, lastname: body.lastname, active: body.active })
    await writeJson(SPEAKER_MEMBER_OVERRIDES_PATH, next)

    return { firstname: body.firstname, lastname: body.lastname, active: body.active }
  })

  // Contrairement à GET /api/talks (public), inclut les talks sans titre et
  // supprimés — c'est la vue admin, pas le portail.
  app.get('/api/admin/talks', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const memberOverrides = await readJson<SpeakerMemberOverride[]>(SPEAKER_MEMBER_OVERRIDES_PATH, [])
    const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, [])
    return applyMemberOverrides(applySpeakerActiveStatus(applyCityOverrides(talks, overrides), speakers), memberOverrides)
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

  // Un talk sans année connue n'est pas servi côté public (voir talks.ts) —
  // cette route permet à un admin de la renseigner depuis l'onglet "Non datés".
  app.put('/api/admin/talks/:id/year', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as { year?: unknown }
    if (typeof body.year !== 'number' || !Number.isInteger(body.year) || body.year < 1900 || body.year > 2100) {
      return reply.code(400).send({ error: 'year must be a valid integer year' })
    }

    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const index = talks.findIndex((t) => t.id === id)
    if (index === -1) return reply.code(404).send({ error: 'not found' })

    talks[index] = { ...talks[index], year: body.year }
    await writeJson(TALKS_PATH, talks)
    return talks[index]
  })

  // Override admin pour un talk sans année connue : l'afficher quand même côté
  // public (après tous les talks datés, voir talks.ts) plutôt que d'attendre une
  // date qu'on ne retrouvera peut-être jamais.
  app.put('/api/admin/talks/:id/show-without-year', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = (request.body ?? {}) as { showWithoutYear?: unknown }
    if (typeof body.showWithoutYear !== 'boolean') {
      return reply.code(400).send({ error: 'showWithoutYear must be a boolean' })
    }

    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const index = talks.findIndex((t) => t.id === id)
    if (index === -1) return reply.code(404).send({ error: 'not found' })

    talks[index] = { ...talks[index], showWithoutYear: body.showWithoutYear }
    await writeJson(TALKS_PATH, talks)
    return talks[index]
  })
}
