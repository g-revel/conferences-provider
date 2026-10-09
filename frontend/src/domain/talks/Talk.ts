import type { Conference } from '../conferences/Conference'
import type { Speaker } from '../speakers/Speaker'

export interface Talk {
  conference: Conference
  speaker: Speaker
  title?: string | null
}
