import { Ticket } from '@/services/tickets'

export type SlaStatus = 'on_time' | 'overdue' | 'at_risk' | 'no_deadline'
export type PeriodKey = 'all' | '7d' | '30d' | 'month' | 'year' | 'custom'

export interface PrioritySlaConfig {
  label: string
  responseTimeHours: number
  solutionTimeHours: number
  solutionLabel: string
  responseLabel: string
}

export const SLA_PRIORITY_CONFIG: Record<string, PrioritySlaConfig> = {
  critical: {
    label: 'Crítico',
    responseTimeHours: 0.5,
    solutionTimeHours: 4,
    solutionLabel: 'Tempo de solução: 2 a 4 horas',
    responseLabel: 'Tempo de resposta: 15 a 30 minutos',
  },
  high: {
    label: 'Alto',
    responseTimeHours: 1,
    solutionTimeHours: 8,
    solutionLabel: 'Tempo de solução: 4 a 8 horas',
    responseLabel: 'Tempo de resposta: até 1 hora',
  },
  medium: {
    label: 'Médio',
    responseTimeHours: 4,
    solutionTimeHours: 24,
    solutionLabel: 'Tempo de solução: até 24 horas',
    responseLabel: 'Tempo de resposta: até 4 horas',
  },
  low: {
    label: 'Baixo',
    responseTimeHours: 8,
    solutionTimeHours: 72,
    solutionLabel: 'Tempo de solução: até 48-72 horas',
    responseLabel: 'Tempo de resposta: até 8 horas',
  },
}

export function getResponseTimeHours(priority: string): number {
  return SLA_PRIORITY_CONFIG[priority]?.responseTimeHours ?? 8
}

export function getSolutionTimeHours(priority: string): number {
  return SLA_PRIORITY_CONFIG[priority]?.solutionTimeHours ?? 72
}

export function getTimeRemainingHours(deadline: string): number {
  const now = new Date().getTime()
  const dl = new Date(deadline).getTime()
  return (dl - now) / (1000 * 60 * 60)
}

export function isSlaAtRisk(ticket: Ticket): boolean {
  if (!ticket) return false
  if (['resolved', 'closed', 'canceled'].includes(ticket.status)) return false

  // 1. Response time risk check (for tickets awaiting initial response)
  if (['open', 'analyzing'].includes(ticket.status)) {
    const responseLimitHours = getResponseTimeHours(ticket.priority)
    const hoursSinceCreation =
      (new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60)
    // Risk triggers at 50% of response threshold (e.g. 15m for critical 30m)
    if (
      hoursSinceCreation >= responseLimitHours * 0.5 &&
      hoursSinceCreation <= responseLimitHours
    ) {
      return true
    }
  }

  // 2. Resolution time risk check
  if (ticket.deadline) {
    const hoursRemaining = getTimeRemainingHours(ticket.deadline)
    const totalDuration = getSolutionTimeHours(ticket.priority)
    const riskThresholdHours = Math.min(2, totalDuration * 0.25)
    if (hoursRemaining >= 0 && hoursRemaining <= riskThresholdHours) {
      return true
    }
  }

  return false
}

export function isSlaOverdue(ticket: Ticket): boolean {
  if (!ticket) return false
  if (['resolved', 'closed'].includes(ticket.status)) {
    return ticket.deadline ? new Date(ticket.updated_at) > new Date(ticket.deadline) : false
  }
  if (ticket.status === 'canceled') return false

  // Response time overdue check
  if (['open', 'analyzing'].includes(ticket.status)) {
    const responseLimitHours = getResponseTimeHours(ticket.priority)
    const hoursSinceCreation =
      (new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreation > responseLimitHours) return true
  }

  // Resolution deadline overdue check
  if (ticket.deadline && new Date() > new Date(ticket.deadline)) {
    return true
  }

  return false
}

export function getSlaStatus(ticket: Ticket): SlaStatus {
  if (!ticket) return 'no_deadline'
  if (isSlaOverdue(ticket)) return 'overdue'
  if (isSlaAtRisk(ticket)) return 'at_risk'
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
