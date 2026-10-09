import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { readJson } from '../data/jsonStore.js'
import { TALKS_PATH } from '../data/paths.js'
import { Speak } from '../collects/get-speaks/speak.js'

export default fp(async function (app: FastifyInstance) {
  app.get('/api/talks', async () => {
    return readJson<Speak[]>(TALKS_PATH, [])
  })
}, {
  name: 'talks-route',
})
