import { supabase } from '@/lib/supabase/client'
import { Ticket } from './tickets'

export interface AgentProductivity {
  assignee_id: string
  assignee_name: string
  assignee_email: string
  avatar_url: string | null
  total_assigned: number
  total_resolved: number
  total_overdue: number
  sla_compliance_pct: number
  avg_resolution_hours: number
}

interface ReportTicket extends Ticket {
  assignee?: { full_name: string; email: string; avatar_url: string | null }
}

export const reportService = {
  async getProductivity(
    period: string = 'month',
    customStart?: string,
    customEnd?: string,
  ): Promise<AgentProductivity[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        assignee:profiles!assignee_id(full_name, email, avatar_url)
      `,
      )
      .not('assignee_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    let tickets = data as unknown as ReportTicket[]

    // Filtrar os tickets pelo período selecionado
    if (period !== 'all') {
      const now = new Date()
      let start: Date
      let end: Date = now

      switch (period) {
        case '7d':
          start = new Date(now)
          start.setDate(start.getDate() - 7)
          break
        case '30d':
          start = new Date(now)
          start.setDate(start.getDate() - 30)
          break
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
          break
        case 'year':
          start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
          break
        case 'custom':
          if (customStart) {
            start = new Date(customStart)
            start.setHours(0, 0, 0, 0)
            if (customEnd) end = new Date(customEnd)
            end.setHours(23, 59, 59, 999)
          } else {
            start = new Date(0)
          }
          break
        default:
          start = new Date(0)
      }

      tickets = tickets.filter((t) => {
        const created = new Date(t.created_at)
        const updated = new Date(t.updated_at)
        return (created >= start && created <= end) || (updated >= start && updated <= end)
      })
    }

    const agentMap = new Map<
      string,
      {
        name: string
        email: string
        avatar_url: string | null
        assigned: number
        resolved: ReportTicket[]
      }
    >()

    tickets.forEach((t) => {
      if (!t.assignee_id || !t.assignee) return
      if (!agentMap.has(t.assignee_id)) {
        agentMap.set(t.assignee_id, {
          name: t.assignee.full_name,
          email: t.assignee.email,
          avatar_url: t.assignee.avatar_url,
          assigned: 0,
          resolved: [],
        })
      }
      const agent = agentMap.get(t.assignee_id)!
      agent.assigned++
      if (['resolved', 'closed'].includes(t.status)) {
        agent.resolved.push(t)
      }
    })

    const result: AgentProductivity[] = []
    agentMap.forEach((agent, assigneeId) => {
      const totalResolved = agent.resolved.length
      const totalOverdue = agent.resolved.filter(
        (t) => t.deadline && new Date(t.updated_at) > new Date(t.deadline),
      ).length
      const onTime = totalResolved - totalOverdue
      const slaPct = totalResolved > 0 ? (onTime / totalResolved) * 100 : 0

      const resolutionTimes = agent.resolved.map((t) => {
        const created = new Date(t.created_at).getTime()
        const resolved = new Date(t.updated_at).getTime()
        return (resolved - created) / (1000 * 60 * 60)
      })
      const avgHours =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0

      result.push({
        assignee_id: assigneeId,
        assignee_name: agent.name,
        assignee_email: agent.email,
        avatar_url: agent.avatar_url,
        total_assigned: agent.assigned,
        total_resolved: totalResolved,
        total_overdue: totalOverdue,
        sla_compliance_pct: slaPct,
        avg_resolution_hours: avgHours,
      })
    })

    return result.sort((a, b) => b.total_resolved - a.total_resolved)
  },
}
