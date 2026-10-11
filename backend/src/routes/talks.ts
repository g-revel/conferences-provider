import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { readJson } from '../data/jsonStore.js'
import { TALKS_PATH } from '../data/paths.js'
import { Speak } from '../collects/get-speaks/speak.js'

// data/talks.json garde volontairement des entrées sans titre (title: null) : elles
// servent de repère au pipeline de collecte (mergeSpeaks.ts) pour savoir qu'un speaker
// connu a déjà été repéré sur une conférence, et remplacer l'entrée dès qu'un run
// ultérieur trouve enfin le vrai titre plutôt que d'ajouter un doublon. Mais ces
// entrées incomplètes n'ont aucune valeur pour l'utilisateur du portail — un talk
// sans titre ne doit jamais être servi.
export default fp(async function (app: FastifyInstance) {
  app.get('/api/talks', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    return talks.filter((talk) => talk.title != null)
  })
}, {
  name: 'talks-route',
})
