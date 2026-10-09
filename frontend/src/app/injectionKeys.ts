import type { InjectionKey } from 'vue'
import type { IConferencesClient } from '../infrastructure/IConferencesClient'
import type { ITalksClient } from '../infrastructure/ITalksClient'

export const conferencesClientKey: InjectionKey<IConferencesClient> = Symbol('conferencesClient')
export const talksClientKey: InjectionKey<ITalksClient> = Symbol('talksClient')
