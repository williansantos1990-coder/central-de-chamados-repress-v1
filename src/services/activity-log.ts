import { supabase } from '@/lib/supabase/client'

export interface ActivityLogInsert {
  ticket_id: number
  user_id: string
  action_type: string
  old_value?: string | null
  new_value?: string | null
}

export const activityLogService = {
  async logActivity(log: ActivityLogInsert) {
    const { data, error } = await supabase.from('activity_log').insert([log]).select().single()
    return { data, error }
  },
}
