import type { Talker } from '../domain/admin/Talker'
import type { Talk } from '../domain/talks/Talk'

export interface IAdminClient {
  login(password: string): Promise<boolean>
  getTalkers(password: string): Promise<Talker[]>
  setTalkerCity(password: string, firstname: string, lastname: string, city: string | null): Promise<void>
  setTalkerActive(password: string, firstname: string, lastname: string, active: boolean): Promise<void>
  getCities(password: string): Promise<string[]>
  addCity(password: string, city: string): Promise<string[]>
  deleteCity(password: string, city: string): Promise<string[]>
  getAllTalks(password: string): Promise<Talk[]>
  deleteTalk(password: string, id: string): Promise<void>
  restoreTalk(password: string, id: string): Promise<void>
  setTalkVideoUrl(password: string, id: string, videoUrl: string): Promise<void>
  setTalkShowWithoutLink(password: string, id: string, showWithoutLink: boolean): Promise<void>
  setTalkYear(password: string, id: string, year: number): Promise<void>
  setTalkShowWithoutYear(password: string, id: string, showWithoutYear: boolean): Promise<void>
}
