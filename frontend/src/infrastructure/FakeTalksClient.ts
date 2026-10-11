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
]

export class FakeTalksClient implements ITalksClient {
  async getTalks(): Promise<Talk[]> {
    return [...TALKS]
  }
}
