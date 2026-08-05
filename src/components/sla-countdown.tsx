import { useState, useEffect } from 'react'
import { Ticket } from '@/services/tickets'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { AlertTriangle, Check } from 'lucide-react'
import { formatSlaCountdown, getTicketResponseTimeHours } from '@/lib/sla-utils'
import { slaService, SlaPolicy } from '@/services/sla'

interface SlaCountdownProps {
  ticket: Ticket
  comments?: any[]
  isAgentOrAdmin?: boolean
  policies?: SlaPolicy[]
}

export function SlaCountdown({
  ticket,
  comments = [],
  isAgentOrAdmin = false,
  policies: propPolicies,
}: SlaCountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now())
  const [policies, setPolicies] = useState<SlaPolicy[]>(propPolicies || [])

  useEffect(() => {
    if (propPolicies && propPolicies.length > 0) {
      setPolicies(propPolicies)
    } else {
      slaService.getPolicies().then(({ data }) => {
        if (data) setPolicies(data as SlaPolicy[])
      })
    }
  }, [propPolicies])

  const isResolvedOrClosed = ['resolved', 'closed', 'canceled'].includes(ticket.status)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!ticket) return null

  // Check if first response has been registered
  const isResponded =
    ticket.status !== 'open' ||
    Boolean(ticket.assignee_id) ||
    comments.some(
      (c) =>
        c.user?.role === 'agent' ||
        c.user?.role === 'admin' ||
        (c.user_id && c.user_id !== ticket.requester_id),
    )

  // 1. Response SLA Calculations
  const responseTimeHours = getTicketResponseTimeHours(ticket, policies)
  const createdAtMs = new Date(ticket.created_at).getTime()
  const responseTotalDurationMs = Math.max(1, responseTimeHours * 3600 * 1000)
  const responseDeadlineMs = createdAtMs + responseTotalDurationMs
  const responseDeadlineDate = new Date(responseDeadlineMs)

  const responseSlaResult = formatSlaCountdown(responseDeadlineDate, now)
  const responseRemainingPercent = Math.max(
    0,
    Math.min(100, (responseSlaResult.remainingMs / responseTotalDurationMs) * 100),
  )

  // 2. Solution SLA Calculations
  const solutionDeadlineDate = ticket.deadline ? new Date(ticket.deadline) : null
  const solutionTotalDurationMs = solutionDeadlineDate
    ? Math.max(1, solutionDeadlineDate.getTime() - createdAtMs)
    : 1
  const solutionSlaResult = solutionDeadlineDate
    ? formatSlaCountdown(solutionDeadlineDate, now)
    : null
  const solutionRemainingPercent = solutionSlaResult
    ? Math.max(0, Math.min(100, (solutionSlaResult.remainingMs / solutionTotalDurationMs) * 100))
    : 0

  return (
    <div className="pt-4 border-t border-dashed space-y-6">
      {/* TEMPO DE RESPOSTA (Only visible to Agents/Admins) */}
      {isAgentOrAdmin && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground uppercase tracking-wider font-semibold">
              Tempo de Resposta
            </span>
            {isResponded ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 font-medium">
                <Check className="w-2.5 h-2.5" />
                Concluído
              </Badge>
            ) : responseSlaResult.isExpired ? (
              <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                SLA Vencido
              </Badge>
            ) : responseSlaResult.isWarning ? (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                Atenção
              </Badge>
            ) : null}
          </div>

          <div className="flex justify-between items-center text-xs font-medium">
            <span>Tempo Restante</span>
            {isResponded ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                Concluído
              </span>
            ) : (
              <span
                className={`font-mono text-xs ${
                  responseSlaResult.isExpired
                    ? 'text-destructive font-bold flex items-center gap-1'
                    : responseSlaResult.isWarning
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-foreground'
                }`}
              >
                {responseSlaResult.isExpired && (
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse shrink-0" />
                )}
                {responseSlaResult.text}
              </span>
            )}
          </div>

          <Progress
            value={isResponded ? 100 : responseRemainingPercent}
            className={`h-2 transition-all ${
              isResponded
                ? '[&>div]:bg-emerald-500'
                : responseSlaResult.isExpired
                  ? 'bg-destructive/20 [&>div]:bg-destructive'
                  : responseSlaResult.isWarning
                    ? 'bg-amber-100 dark:bg-amber-950/40 [&>div]:bg-amber-500'
                    : '[&>div]:bg-primary'
            }`}
          />

          <div className="text-xs text-muted-foreground text-right">
            Prazo: {format(responseDeadlineDate, 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
      )}

      {/* TEMPO DE SOLUÇÃO (Visible to Everyone) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground uppercase tracking-wider font-semibold">
            Tempo de Solução
          </span>
          {isResolvedOrClosed ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 font-medium">
              <Check className="w-2.5 h-2.5" />
              Encerrado
            </Badge>
          ) : solutionSlaResult?.isExpired ? (
            <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
              SLA Vencido
            </Badge>
          ) : solutionSlaResult?.isWarning ? (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              Atenção
            </Badge>
          ) : null}
        </div>

        {!solutionDeadlineDate ? (
          <div className="text-muted-foreground text-xs">Sem prazo definido</div>
        ) : isResolvedOrClosed ? (
          <>
            <div className="flex justify-between text-xs font-medium">
              <span>Tempo Restante</span>
              <span className="text-muted-foreground font-semibold">Encerrado</span>
            </div>
            <Progress value={100} className="h-2 [&>div]:bg-muted-foreground/40" />
            <div className="text-xs text-muted-foreground text-right">
              Prazo: {format(solutionDeadlineDate, 'dd/MM/yyyy HH:mm')}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center text-xs font-medium">
              <span>Tempo Restante</span>
              <span
                className={`font-mono text-xs ${
                  solutionSlaResult?.isExpired
                    ? 'text-destructive font-bold flex items-center gap-1'
                    : solutionSlaResult?.isWarning
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-foreground'
                }`}
              >
                {solutionSlaResult?.isExpired && (
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse shrink-0" />
                )}
                {solutionSlaResult?.text}
              </span>
            </div>

            <Progress
              value={solutionRemainingPercent}
              className={`h-2 transition-all ${
                solutionSlaResult?.isExpired
                  ? 'bg-destructive/20 [&>div]:bg-destructive'
                  : solutionSlaResult?.isWarning
                    ? 'bg-amber-100 dark:bg-amber-950/40 [&>div]:bg-amber-500'
                    : '[&>div]:bg-primary'
              }`}
            />

            <div className="text-xs text-muted-foreground text-right">
              Prazo: {format(solutionDeadlineDate, 'dd/MM/yyyy HH:mm')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
