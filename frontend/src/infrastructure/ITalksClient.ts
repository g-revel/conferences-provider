import type { Talk } from '../domain/talks/Talk'

export interface ITalksClient {
  getTalks(): Promise<Talk[]>
}
