import type { Conference } from '../conferences/Conference'
import type { Speaker } from '../speakers/Speaker'

export interface Talk {
  id?: string
  conference: Conference
  speakers: Speaker[]
  title?: string | null
  videoUrl?: string | null
  category?: string | null
  format?: string | null
  level?: string | null
  language?: string | null
  slidesUrl?: string | null
  description?: string | null
  year?: number | null
  deletedAt?: string | null
}
