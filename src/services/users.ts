import { supabase } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'agent' | 'requester'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  phone: string | null
  sector: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface NewUserPayload {
  email: string
  password: string
  full_name: string
  role: UserRole
  phone?: string | null
  sector?: string | null
}

export interface UpdateUserPayload {
  full_name?: string
  email?: string
  role?: UserRole
  phone?: string | null
  sector?: string | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  agent: 'Atendente',
  requester: 'Solicitante',
}

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/30',
  agent: 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/30',
  requester: 'bg-slate-500/15 text-slate-600 hover:bg-slate-500/25 border-slate-500/30',
}

export const userService = {
  async getAll(): Promise<{ data: UserProfile[] | null; error: any }> {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, role, phone, sector, avatar_url, created_at, updated_at')
      .order('created_at', { ascending: true })
    return { data: data as UserProfile[] | null, error }
  },

  async update(id: string, payload: UpdateUserPayload): Promise<{ error: any }> {
    const { error } = await (supabase as any).from('profiles').update(payload).eq('id', id)
    return { error }
  },

  async changeRole(id: string, role: UserRole): Promise<{ error: any }> {
    const { error } = await (supabase as any).from('profiles').update({ role }).eq('id', id)
    return { error }
  },

  async create(payload: NewUserPayload): Promise<{ data: { id: string } | null; error: any }> {
    const { data, error } = await supabase.functions.invoke('user-admin', {
      method: 'POST',
      body: { action: 'create', ...payload },
    })
    if (error) return { data: null, error }
    if (data?.error) return { data: null, error: new Error(data.error) }
    return { data: data as { id: string }, error: null }
  },

  async remove(userId: string): Promise<{ error: any }> {
    const { data, error } = await supabase.functions.invoke('user-admin', {
      method: 'POST',
      body: { action: 'delete', userId },
    })
    if (error) return { error }
    if (data?.error) return { error: new Error(data.error) }
    return { error: null }
  },
}
