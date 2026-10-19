import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { readJson } from '../data/jsonStore.js'
import { TALKS_PATH, SPEAKER_CITY_OVERRIDES_PATH } from '../data/paths.js'
import { Speak } from '../collects/get-speaks/speak.js'
import { SpeakerCityOverride } from '../collects/get-all-speakers/speakerCityOverride.js'
import { applyCityOverrides } from '../collects/get-speaks/applyCityOverrides.js'

// data/talks.json garde volontairement des entrées sans titre (title: null) : elles
// servent de repère au pipeline de collecte (mergeSpeaks.ts) pour savoir qu'un speaker
// connu a déjà été repéré sur une conférence, et remplacer l'entrée dès qu'un run
// ultérieur trouve enfin le vrai titre plutôt que d'ajouter un doublon. Mais ces
// entrées incomplètes n'ont aucune valeur pour l'utilisateur du portail — un talk
// sans titre ne doit jamais être servi. Pareil pour les talks supprimés côté admin
// (deletedAt) : toujours dans le fichier (corbeille admin), jamais servis ici.
export default fp(async function (app: FastifyInstance) {
  app.get('/api/talks', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const visible = talks.filter((talk) => talk.title != null && talk.deletedAt == null)
    return applyCityOverrides(visible, overrides)
  })
}, {
  name: 'talks-route',
})
