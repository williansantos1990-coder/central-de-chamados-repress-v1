import { useState, useEffect } from 'react'
import { Ticket } from '@/services/tickets'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { AlertTriangle, Check } from 'lucide-react'
import { getTicketResponseSla, getTicketSolutionSla } from '@/lib/sla-utils'
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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!ticket) return null

  const responseSla = getTicketResponseSla(ticket, policies, comments, now)
  const solutionSla = getTicketSolutionSla(ticket, policies, now)

  return (
    <div className="pt-4 border-t border-dashed space-y-6">
      {/* TEMPO DE RESPOSTA (Visible to Agents/Admins) */}
      {isAgentOrAdmin && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground uppercase tracking-wider font-semibold">
              Tempo de Resposta
            </span>
            {responseSla.isResponded ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 font-medium">
                <Check className="w-2.5 h-2.5" />
                Concluído
              </Badge>
            ) : responseSla.status === 'expired' ? (
              <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                SLA Vencido
              </Badge>
            ) : responseSla.status === 'warning' ? (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                Atenção
              </Badge>
            ) : null}
          </div>

          <div className="flex justify-between items-center text-xs font-medium">
            <span>Tempo Restante</span>
            {responseSla.isResponded ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                Concluído
              </span>
            ) : (
              <span
                className={`font-mono text-xs ${
                  responseSla.status === 'expired'
                    ? 'text-destructive font-bold flex items-center gap-1'
                    : responseSla.status === 'warning'
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-foreground'
                }`}
              >
                {responseSla.status === 'expired' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse shrink-0" />
                )}
                {responseSla.countdown.text}
              </span>
            )}
          </div>

          <Progress
            value={responseSla.isResponded ? 100 : responseSla.remainingPercent}
            className={`h-2 transition-all ${
              responseSla.isResponded
                ? '[&>div]:bg-emerald-500'
                : responseSla.status === 'expired'
                  ? 'bg-destructive/20 [&>div]:bg-destructive'
                  : responseSla.status === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-950/40 [&>div]:bg-amber-500'
                    : '[&>div]:bg-primary'
            }`}
          />

          {responseSla.deadline && (
            <div className="text-xs text-muted-foreground text-right">
              Prazo: {format(responseSla.deadline, 'dd/MM/yyyy HH:mm')}
            </div>
          )}
        </div>
      )}

      {/* TEMPO DE SOLUÇÃO */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground uppercase tracking-wider font-semibold">
            Tempo de Solução
          </span>
          {solutionSla.isResolvedOrClosed ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 font-medium">
              <Check className="w-2.5 h-2.5" />
              Encerrado
            </Badge>
          ) : solutionSla.status === 'expired' ? (
            <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
              SLA Vencido
            </Badge>
          ) : solutionSla.status === 'warning' ? (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              Atenção
            </Badge>
          ) : null}
        </div>

        {!solutionSla.deadline ? (
          <div className="text-muted-foreground text-xs">Sem prazo definido</div>
        ) : solutionSla.isResolvedOrClosed ? (
          <>
            <div className="flex justify-between text-xs font-medium">
              <span>Tempo Restante</span>
              <span className="text-muted-foreground font-semibold">Encerrado</span>
            </div>
            <Progress value={100} className="h-2 [&>div]:bg-muted-foreground/40" />
            <div className="text-xs text-muted-foreground text-right">
              Prazo: {format(solutionSla.deadline, 'dd/MM/yyyy HH:mm')}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center text-xs font-medium">
              <span>Tempo Restante</span>
              <span
                className={`font-mono text-xs ${
                  solutionSla.status === 'expired'
                    ? 'text-destructive font-bold flex items-center gap-1'
                    : solutionSla.status === 'warning'
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-foreground'
                }`}
              >
                {solutionSla.status === 'expired' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse shrink-0" />
                )}
                {solutionSla.countdown.text}
              </span>
            </div>

            <Progress
              value={solutionSla.remainingPercent}
              className={`h-2 transition-all ${
                solutionSla.status === 'expired'
                  ? 'bg-destructive/20 [&>div]:bg-destructive'
                  : solutionSla.status === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-950/40 [&>div]:bg-amber-500'
                    : '[&>div]:bg-primary'
              }`}
            />

            <div className="text-xs text-muted-foreground text-right">
              Prazo: {format(solutionSla.deadline, 'dd/MM/yyyy HH:mm')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
