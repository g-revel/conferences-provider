export interface Speaker {
  firstname: string
  lastname: string
  company: string
  city?: string | null
  // undefined/true = toujours chez Shodo ; false = parti (compte Slack désactivé).
  active?: boolean
}
