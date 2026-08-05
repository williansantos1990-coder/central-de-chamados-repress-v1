import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export type Category = Database['public']['Tables']['categories']['Row']
export type TicketPriority = Database['public']['Enums']['ticket_priority']

export interface SlaPolicy {
  id: string
  category_id: string
  priority: TicketPriority
  duration_hours: number
  response_time_hours?: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface SlaPolicyInsert {
  category_id: string
  priority: TicketPriority
  duration_hours: number
  response_time_hours?: number
}

export const slaService = {
  getPolicies: async () => {
    return await (supabase as any)
      .from('sla_policies')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
  },
  getCategories: async () => {
    return await supabase.from('categories').select('*').order('name')
  },
  createPolicy: async (policy: SlaPolicyInsert) => {
    return await (supabase as any).from('sla_policies').insert(policy).select().single()
  },
  deletePolicy: async (id: string) => {
    return await (supabase as any).from('sla_policies').delete().eq('id', id)
  },
}
