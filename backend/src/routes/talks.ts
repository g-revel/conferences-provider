import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { readJson } from '../data/jsonStore.js'
import { TALKS_PATH, SPEAKER_CITY_OVERRIDES_PATH, SPEAKER_MEMBER_OVERRIDES_PATH, SPEAKERS_PATH } from '../data/paths.js'
import { Speak } from '../collects/get-speaks/speak.js'
import { Speaker } from '../collects/get-all-speakers/speaker.js'
import { SpeakerCityOverride } from '../collects/get-all-speakers/speakerCityOverride.js'
import { SpeakerMemberOverride } from '../collects/get-all-speakers/speakerMemberOverride.js'
import { applyCityOverrides } from '../collects/get-speaks/applyCityOverrides.js'
import { applySpeakerActiveStatus } from '../collects/get-speaks/applySpeakerActiveStatus.js'
import { applyMemberOverrides } from '../collects/get-speaks/applyMemberOverrides.js'

// data/talks.json garde volontairement des entrées sans titre (title: null) : elles
// servent de repère au pipeline de collecte (mergeSpeaks.ts) pour savoir qu'un speaker
// connu a déjà été repéré sur une conférence, et remplacer l'entrée dès qu'un run
// ultérieur trouve enfin le vrai titre plutôt que d'ajouter un doublon. Mais ces
// entrées incomplètes n'ont aucune valeur pour l'utilisateur du portail — un talk
// sans titre ne doit jamais être servi. Pareil pour les talks supprimés côté admin
// (deletedAt) : toujours dans le fichier (corbeille admin), jamais servis ici.
//
// Un talk sans videoUrl connu n'est pas servi non plus, sauf si un admin a coché
// "montrer sans lien" (showWithoutLink) dans la file d'attente de validation —
// un lien candidat trouvé automatiquement (pendingVideoUrl) ne suffit jamais à
// lui seul : il doit être validé (promu en videoUrl) par un humain d'abord.
export default fp(async function (app: FastifyInstance) {
  app.get('/api/talks', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const memberOverrides = await readJson<SpeakerMemberOverride[]>(SPEAKER_MEMBER_OVERRIDES_PATH, [])
    const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, [])
    const visible = talks.filter(
      (talk) => talk.title != null && talk.deletedAt == null && (talk.videoUrl != null || talk.showWithoutLink === true),
    )
    return applyMemberOverrides(applySpeakerActiveStatus(applyCityOverrides(visible, overrides), speakers), memberOverrides)
  })
}, {
  name: 'talks-route',
})
