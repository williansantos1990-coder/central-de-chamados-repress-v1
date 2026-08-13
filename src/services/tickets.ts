import { supabase } from '@/lib/supabase/client'

export type Ticket = {
  id: number
  title: string
  description: string
  requester_id: string
  assignee_id: string | null
  category_id: string
  service_type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status:
    | 'open'
    | 'analyzing'
    | 'waiting_requester'
    | 'in_service'
    | 'resolved'
    | 'closed'
    | 'canceled'
  deadline: string | null
  created_at: string
  updated_at: string
  requester?: { full_name: string; email: string }
  assignee?: { full_name: string; email: string }
  category?: { name: string }
}

export const ticketService = {
  async getTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!requester_id(full_name, email),
        assignee:profiles!assignee_id(full_name, email),
        category:categories(name)
      `)
      .order('created_at', { ascending: false })
    return { data: data as unknown as Ticket[], error }
  },
  async getTicket(id: number) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!requester_id(full_name, email),
        assignee:profiles!assignee_id(full_name, email),
        category:categories(name)
      `)
      .eq('id', id)
      .single()
    return { data: data as unknown as Ticket, error }
  },
  async createTicket(payload: Partial<Ticket>) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([payload as any])
      .select()
      .single()
    return { data: data as unknown as Ticket, error }
  },
  async updateTicket(id: number, payload: Partial<Ticket>) {
    const { data, error } = await supabase
      .from('tickets')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single()
    return { data: data as unknown as Ticket, error }
  },
  async getAssignees() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['admin', 'agent'])
      .order('full_name', { ascending: true })
    return { data, error }
  },
}
