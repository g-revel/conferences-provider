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
//
// Un talk sans année connue (`year` absent) ou daté de 2024 ou avant n'est pas
// servi non plus — demandé explicitement, pour ne montrer que les talks récents —
// sauf si un admin a coché "montrer sans date" (showWithoutYear) depuis l'onglet
// "Non datés", auquel cas il apparaît après tous les talks datés (tri par année
// décroissante, les non-datés n'ont pas de position naturelle dans ce tri).
// Jamais supprimé pour autant : reste dans talks.json, resservira plus tard (ex.
// un admin lui assigne une année depuis l'onglet "Non datés").
const MIN_VISIBLE_YEAR = 2025

export default fp(async function (app: FastifyInstance) {
  app.get('/api/talks', async () => {
    const talks = await readJson<Speak[]>(TALKS_PATH, [])
    const overrides = await readJson<SpeakerCityOverride[]>(SPEAKER_CITY_OVERRIDES_PATH, [])
    const memberOverrides = await readJson<SpeakerMemberOverride[]>(SPEAKER_MEMBER_OVERRIDES_PATH, [])
    const speakers = await readJson<Speaker[]>(SPEAKERS_PATH, [])
    const visible = talks
      .filter(
        (talk) =>
          talk.title != null &&
          talk.deletedAt == null &&
          (talk.videoUrl != null || talk.showWithoutLink === true) &&
          ((talk.year != null && talk.year >= MIN_VISIBLE_YEAR) || talk.showWithoutYear === true),
      )
      .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity))
    return applyMemberOverrides(applySpeakerActiveStatus(applyCityOverrides(visible, overrides), speakers), memberOverrides)
  })
}, {
  name: 'talks-route',
})
