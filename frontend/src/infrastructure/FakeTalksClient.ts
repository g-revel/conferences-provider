import type { Talk } from '../domain/talks/Talk'
import type { ITalksClient } from './ITalksClient'

const TALKS: Talk[] = [
  {
    conference: { name: 'BreizhCamp', url: 'https://www.breizhcamp.org/programme' },
    speakers: [
      { firstname: 'Emmanuelle', lastname: 'Aboaf', company: 'Shodo' },
      { firstname: 'Manon', lastname: 'Carbonnel', company: 'Shodo Rennes' },
    ],
    title: "Quand l’accessibilité rencontre le Mob : pratiquer, tester, corriger ensemble",
    videoUrl: 'https://www.youtube.com/watch?v=n6BSMASkoWw',
    category: 'Frontend & Accessibilité',
  },
  {
    conference: { name: 'BreizhCamp', url: 'https://www.breizhcamp.org/programme' },
    speakers: [{ firstname: 'Guillaume', lastname: 'Yan', company: 'Shodo Rennes' }],
    title: 'Atelier Micronaut : on code, on compare, on décortique',
    category: 'Architecture & Craft',
  },
  {
    conference: { name: 'MixIT', url: 'https://mixitconf.org/schedule' },
    speakers: [{ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo' }],
    title: "Pourquoi la Tech tient plus de la pop culture que de l'ingénierie?",
    videoUrl: 'https://www.youtube.com/watch?v=1JA3wPw7dsw',
    category: 'Culture & Inclusion',
  },
  {
    conference: { name: 'Devoxx France' },
    speakers: [{ firstname: 'Julien', lastname: 'Topcu', company: 'Shodo' }],
    title: "L'Architecture Hexagonale par la pratique, le live coding qui rendra vos applications plus robustes et maintenables",
    videoUrl: 'https://www.youtube.com/watch?v=-dXN8wkN0yk',
    category: 'Architecture & Craft',
    format: 'Conférence (40-50min)',
    level: 'Débutant',
    language: 'Français',
    slidesUrl: 'https://slides.com/julientopcu/hexagonal-architecture-in-practice-live-coding-that-will-make-your-applications-more-sustainable',
    description:
      "Il arrive toujours un moment où, le logiciel est tellement gros et vieux qu'il devient inmaintenable. Impossible de mettre à jour la stack technique sans tout casser, les nouvelles fonctionnalités deviennent de plus en plus longue à implémenter et la dette technique étant tellement lourde que le refactoring devient exorbitant.\n\nEt si on vous disait que tout ça était plus un problème de pratique qu'un problème de vieillesse du logiciel ?",
  },
]

export class FakeTalksClient implements ITalksClient {
  async getTalks(): Promise<Talk[]> {
    return [...TALKS]
  }
}
