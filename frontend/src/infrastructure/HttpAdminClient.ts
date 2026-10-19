import type { IAdminClient } from './IAdminClient'
import type { Talker } from '../domain/admin/Talker'
import type { Talk } from '../domain/talks/Talk'

export class HttpAdminClient implements IAdminClient {
  async login(password: string): Promise<boolean> {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    return response.ok
  }

  async getTalkers(password: string): Promise<Talker[]> {
    const response = await fetch('/api/admin/talkers', { headers: { 'x-admin-password': password } })
    return response.json()
  }

  async setTalkerCity(password: string, firstname: string, lastname: string, city: string | null): Promise<void> {
    await fetch('/api/admin/talkers/city', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ firstname, lastname, city }),
    })
  }

  async getAllTalks(password: string): Promise<Talk[]> {
    const response = await fetch('/api/admin/talks', { headers: { 'x-admin-password': password } })
    return response.json()
  }

  async deleteTalk(password: string, id: string): Promise<void> {
    await fetch(`/api/admin/talks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    })
  }

  async restoreTalk(password: string, id: string): Promise<void> {
    await fetch(`/api/admin/talks/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
      headers: { 'x-admin-password': password },
    })
  }
}
