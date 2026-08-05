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

export interface SlaPolicyData {
  response_time_hours: number | null
  duration_hours: number
}

export type SlaPolicyMap = Map<string, SlaPolicyData>

export function buildSlaPolicyMap(policies: Array<any>): SlaPolicyMap {
  const map = new Map<string, SlaPolicyData>()
  if (Array.isArray(policies)) {
    for (const p of policies) {
      map.set(`${p.category_id}:${p.priority}`, {
        response_time_hours: p.response_time_hours ?? null,
        duration_hours: p.duration_hours,
      })
    }
  }
  return map
}

export function getPolicyForTicket(
  ticket: Ticket,
  policies?: SlaPolicyData[] | SlaPolicyMap | any[],
): SlaPolicyData | null {
  if (!ticket || !policies) return null
  if (policies instanceof Map) {
    return policies.get(`${ticket.category_id}:${ticket.priority}`) ?? null
  }
  if (Array.isArray(policies)) {
    const found = policies.find(
      (p: any) => p.category_id === ticket.category_id && p.priority === ticket.priority,
    )
    if (found) {
      return {
        response_time_hours: found.response_time_hours ?? null,
        duration_hours: found.duration_hours,
      }
    }
  }
  return null
}

export function getResponseTimeHours(priority: string): number {
  return SLA_PRIORITY_CONFIG[priority]?.responseTimeHours ?? 8
}

export function getSolutionTimeHours(priority: string): number {
  return SLA_PRIORITY_CONFIG[priority]?.solutionTimeHours ?? 72
}

export function getTicketResponseTimeHours(ticket: Ticket, policies?: any): number {
  if (!ticket) return 8
  const policy = getPolicyForTicket(ticket, policies)
  if (policy && policy.response_time_hours != null) return Number(policy.response_time_hours)
  return getResponseTimeHours(ticket.priority)
}

export function getTicketSolutionTimeHours(ticket: Ticket, policies?: any): number {
  if (!ticket) return 72
  const policy = getPolicyForTicket(ticket, policies)
  if (policy && policy.duration_hours != null) return Number(policy.duration_hours)
  return getSolutionTimeHours(ticket.priority)
}

export function getTicketResponseDeadline(ticket: Ticket, policies?: any): Date {
  const hours = getTicketResponseTimeHours(ticket, policies)
  const createdAtMs = new Date(ticket.created_at).getTime()
  return new Date(createdAtMs + hours * 3600 * 1000)
}

export function getTicketSolutionDeadline(ticket: Ticket, policies?: any): Date | null {
  if (!ticket) return null
  if (ticket.deadline) return new Date(ticket.deadline)
  const hours = getTicketSolutionTimeHours(ticket, policies)
  if (!hours) return null
  const createdAtMs = new Date(ticket.created_at).getTime()
  return new Date(createdAtMs + hours * 3600 * 1000)
}

export function isTicketResponded(ticket: Ticket, comments?: any[]): boolean {
  if (!ticket) return false
  if (ticket.status !== 'open') return true
  if (ticket.assignee_id) return true
  if (comments && comments.length > 0) {
    return comments.some(
      (c) =>
        c.user?.role === 'agent' ||
        c.user?.role === 'admin' ||
        (c.user_id && c.user_id !== ticket.requester_id),
    )
  }
  return false
}

export interface SlaCountdownResult {
  text: string
  isExpired: boolean
  isWarning: boolean
  remainingMs: number
}

export function formatSlaCountdown(
  deadline: string | Date,
  nowMs: number = Date.now(),
): SlaCountdownResult {
  const deadlineMs = new Date(deadline).getTime()
  const remainingMs = deadlineMs - nowMs

  if (remainingMs <= 0) {
    return { text: 'Expirado', isExpired: true, isWarning: false, remainingMs: 0 }
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  const text = days > 0 ? `${days}d ${timeStr}` : timeStr
  const isWarning = totalSeconds <= 3600

  return { text, isExpired: false, isWarning, remainingMs }
}

export interface SlaPhaseResult {
  phase: 'response' | 'solution'
  isResponded?: boolean
  isResolvedOrClosed?: boolean
  deadline: Date | null
  countdown: SlaCountdownResult
  remainingPercent: number
  status: 'completed' | 'expired' | 'warning' | 'on_time' | 'no_deadline'
}

export function getTicketResponseSla(
  ticket: Ticket,
  policies?: any,
  comments?: any[],
  nowMs: number = Date.now(),
): SlaPhaseResult {
  const responded = isTicketResponded(ticket, comments)
  const hours = getTicketResponseTimeHours(ticket, policies)
  const deadline = getTicketResponseDeadline(ticket, policies)
  const countdown = formatSlaCountdown(deadline, nowMs)
  const totalDurationMs = Math.max(1, hours * 3600 * 1000)
  const remainingPercent = Math.max(
    0,
    Math.min(100, (countdown.remainingMs / totalDurationMs) * 100),
  )

  let status: 'completed' | 'expired' | 'warning' | 'on_time' = 'on_time'
  if (responded) {
    status = 'completed'
  } else if (countdown.isExpired) {
    status = 'expired'
  } else if (countdown.isWarning) {
    status = 'warning'
  }

  return {
    phase: 'response',
    isResponded: responded,
    deadline,
    countdown,
    remainingPercent,
    status,
  }
}

export function getTicketSolutionSla(
  ticket: Ticket,
  policies?: any,
  nowMs: number = Date.now(),
): SlaPhaseResult {
  const resolvedOrClosed = ['resolved', 'closed', 'canceled'].includes(ticket.status)
  const deadline = getTicketSolutionDeadline(ticket, policies)

  if (!deadline) {
    return {
      phase: 'solution',
      isResolvedOrClosed: resolvedOrClosed,
      deadline: null,
      countdown: { text: 'Sem prazo', isExpired: false, isWarning: false, remainingMs: 0 },
      remainingPercent: 0,
      status: resolvedOrClosed ? 'completed' : 'no_deadline',
    }
  }

  const countdown = formatSlaCountdown(deadline, nowMs)
  const createdAtMs = new Date(ticket.created_at).getTime()
  const totalDurationMs = Math.max(1, deadline.getTime() - createdAtMs)
  const remainingPercent = Math.max(
    0,
    Math.min(100, (countdown.remainingMs / totalDurationMs) * 100),
  )

  let status: 'completed' | 'expired' | 'warning' | 'on_time' | 'no_deadline' = 'on_time'
  if (resolvedOrClosed) {
    status = 'completed'
  } else if (countdown.isExpired) {
    status = 'expired'
  } else if (countdown.isWarning) {
    status = 'warning'
  }

  return {
    phase: 'solution',
    isResolvedOrClosed: resolvedOrClosed,
    deadline,
    countdown,
    remainingPercent,
    status,
  }
}

export function isSlaAtRisk(ticket: Ticket): boolean {
  const res = getTicketResponseSla(ticket)
  const sol = getTicketSolutionSla(ticket)
  return res.status === 'warning' || sol.status === 'warning'
}

export function isSlaOverdue(ticket: Ticket): boolean {
  const res = getTicketResponseSla(ticket)
  const sol = getTicketSolutionSla(ticket)
  return res.status === 'expired' || sol.status === 'expired'
}

export function getSlaStatus(ticket: Ticket): SlaStatus {
  if (!ticket) return 'no_deadline'
  if (isSlaOverdue(ticket)) return 'overdue'
  if (isSlaAtRisk(ticket)) return 'at_risk'
  return 'on_time'
}

export function isResponseTimeAtRisk(ticket: Ticket, policyMap?: any): boolean {
  return getTicketResponseSla(ticket, policyMap).status === 'warning'
}

export function isResponseTimeOverdue(ticket: Ticket, policyMap?: any): boolean {
  return getTicketResponseSla(ticket, policyMap).status === 'expired'
}

export function isSolutionTimeAtRisk(ticket: Ticket, policyMap?: any): boolean {
  return getTicketSolutionSla(ticket, policyMap).status === 'warning'
}

export function isSolutionTimeOverdue(ticket: Ticket, policyMap?: any): boolean {
  return getTicketSolutionSla(ticket, policyMap).status === 'expired'
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
      if (customEnd) end = new Date(customEnd)
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
  if (hours < 1) return `${Math.round(hours * 60)}min`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  return `${days}d ${remainingHours}h`
}
