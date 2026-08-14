import { supabase } from '@/lib/supabase/client'

export interface NotificationPayload {
  event: 'new_ticket' | 'assignment' | 'status_change' | 'comment' | 'redirection' | 'resolution'
  ticket_id: number
  actor_id?: string
  details?: {
    old_status?: string
    new_status?: string
    old_assignee_name?: string
    new_assignee_name?: string
    comment_content?: string
    is_internal?: boolean
    redirect_from?: string
    redirect_to?: string
  }
}

export const notificationService = {
  async sendNotification(payload: NotificationPayload) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: payload,
      })
      if (error) {
        console.error('Failed to send notification via edge function:', error)
      }
      return { data, error }
    } catch (err) {
      console.error('Error invoking send-email-notification:', err)
      return { data: null, error: err }
    }
  },
}
