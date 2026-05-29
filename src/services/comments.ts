import { supabase } from '@/lib/supabase/client'

export const commentService = {
  async getComments(ticketId: number) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(full_name, avatar_url, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    return { data, error }
  },
  async addComment(payload: any) {
    const { data, error } = await supabase.from('comments').insert([payload]).select().single()
    return { data, error }
  },
}
