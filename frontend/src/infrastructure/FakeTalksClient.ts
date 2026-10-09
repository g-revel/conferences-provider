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
  },
  {
    conference: { name: 'BreizhCamp', url: 'https://www.breizhcamp.org/programme' },
    speakers: [{ firstname: 'Guillaume', lastname: 'Yan', company: 'Shodo Rennes' }],
    title: 'Atelier Micronaut : on code, on compare, on décortique',
  },
]

export class FakeTalksClient implements ITalksClient {
  async getTalks(): Promise<Talk[]> {
    return [...TALKS]
  }
}
