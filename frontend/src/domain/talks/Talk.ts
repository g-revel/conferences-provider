import type { Conference } from '../conferences/Conference'
import type { Speaker } from '../speakers/Speaker'

export interface Talk {
  conference: Conference
  speakers: Speaker[]
  title?: string | null
  videoUrl?: string | null
}
