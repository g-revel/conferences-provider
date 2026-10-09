import type { Talk } from '../domain/talks/Talk'
import type { ITalksClient } from './ITalksClient'

export class HttpTalksClient implements ITalksClient {
  async getTalks(): Promise<Talk[]> {
    const response = await fetch('/api/talks')
    return response.json()
  }
}
