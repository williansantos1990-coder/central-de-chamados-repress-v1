import { Ticket } from '@/services/tickets'

export type SlaStatus = 'on_time' | 'overdue' | 'at_risk' | 'no_deadline'
export type PeriodKey = 'all' | '7d' | '30d' | 'month' | 'year' | 'custom'

export function getTimeRemainingHours(deadline: string): number {
  const now = new Date().getTime()
  const dl = new Date(deadline).getTime()
  return (dl - now) / (1000 * 60 * 60)
}

export function isSlaAtRisk(ticket: Ticket): boolean {
  if (!ticket.deadline) return false
  if (['resolved', 'closed', 'canceled'].includes(ticket.status)) return false
  const hours = getTimeRemainingHours(ticket.deadline)
  return hours >= 0 && hours < 2
}

export function isSlaOverdue(ticket: Ticket): boolean {
  if (!ticket.deadline) return false
  if (['resolved', 'closed'].includes(ticket.status)) {
    return new Date(ticket.updated_at) > new Date(ticket.deadline)
  }
  if (ticket.status === 'canceled') return false
  return new Date() > new Date(ticket.deadline)
}

export function getSlaStatus(ticket: Ticket): SlaStatus {
  if (!ticket.deadline) return 'no_deadline'
  if (isSlaAtRisk(ticket)) return 'at_risk'
  if (isSlaOverdue(ticket)) return 'overdue'
  return 'on_time'
}

export function filterTicketsByPeriod(
  tickets: Ticket[],
  period: PeriodKey,
  customStart?: string,
  customEnd?: string,
): Ticket[] {
  if (period === 'all') return tickets
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
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'custom':
      if (!customStart) return tickets
      start = new Date(customStart)
      if (customEnd) {
        end = new Date(customEnd)
      }
      end.setHours(23, 59, 59, 999)
      break
    default:
      return tickets
  }

  return tickets.filter((t) => {
    const created = new Date(t.created_at)
    return created >= start && created <= end
  })
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60)
    return `${mins}min`
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  return `${days}d ${remainingHours}h`
}
