import { useState, useEffect } from 'react'
import { Ticket } from '@/services/tickets'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { AlertTriangle, Check, Clock, AlarmClock } from 'lucide-react'
import { getTicketResponseSla, getTicketSolutionSla, SlaPolicyMap } from '@/lib/sla-utils'

interface SlaTicketCellProps {
  ticket: Ticket
  policyMap?: SlaPolicyMap | any[]
  isAgentOrAdmin?: boolean
}

export function SlaTicketCell({ ticket, policyMap, isAgentOrAdmin = true }: SlaTicketCellProps) {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!ticket) return null

  const responseSla = getTicketResponseSla(ticket, policyMap, [], now)
  const solutionSla = getTicketSolutionSla(ticket, policyMap, now)

  const isResponseActive = isAgentOrAdmin && !responseSla.isResponded

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1 min-w-[130px] text-xs">
            {isResponseActive ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  {responseSla.status === 'expired' ? (
                    <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                      <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                      Tempo de Resposta
                    </Badge>
                  ) : responseSla.status === 'warning' ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Tempo de Resposta
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      Tempo de Resposta
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] font-mono font-semibold">
                  <span
                    className={
                      responseSla.status === 'expired'
                        ? 'text-destructive font-bold flex items-center gap-1'
                        : responseSla.status === 'warning'
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-foreground'
                    }
                  >
                    {responseSla.status === 'expired' && (
                      <AlertTriangle className="w-3 h-3 text-destructive animate-pulse shrink-0 inline" />
                    )}
                    {responseSla.countdown.text}
                  </span>
                </div>

                {responseSla.deadline && (
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    Prazo: {format(responseSla.deadline, 'dd/MM/yyyy HH:mm')}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  {isAgentOrAdmin && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-[9px] gap-0.5 px-1 py-0 font-medium">
                      <Check className="w-2.5 h-2.5" />
                      Resposta OK
                    </Badge>
                  )}

                  {solutionSla.isResolvedOrClosed ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 font-medium">
                      <Check className="w-2.5 h-2.5" />
                      Encerrado
                    </Badge>
                  ) : solutionSla.status === 'expired' ? (
                    <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                      <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                      Tempo de Solução
                    </Badge>
                  ) : solutionSla.status === 'warning' ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                      <AlarmClock className="w-2.5 h-2.5" />
                      Tempo de Solução
                    </Badge>
                  ) : (
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
                      <AlarmClock className="w-2.5 h-2.5" />
                      Tempo de Solução
                    </Badge>
                  )}
                </div>

                {!solutionSla.deadline ? (
                  <div className="text-[10px] text-muted-foreground font-medium">
                    Sem prazo definido
                  </div>
                ) : solutionSla.isResolvedOrClosed ? (
                  <div className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    Prazo: {format(solutionSla.deadline, 'dd/MM/yyyy HH:mm')}
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-mono font-semibold">
                      <span
                        className={
                          solutionSla.status === 'expired'
                            ? 'text-destructive font-bold flex items-center gap-1'
                            : solutionSla.status === 'warning'
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-foreground'
                        }
                      >
                        {solutionSla.status === 'expired' && (
                          <AlertTriangle className="w-3 h-3 text-destructive animate-pulse shrink-0 inline" />
                        )}
                        {solutionSla.countdown.text}
                      </span>
                    </div>

                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      Prazo: {format(solutionSla.deadline, 'dd/MM/yyyy HH:mm')}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs space-y-1.5 p-2.5 max-w-xs">
          <div className="font-semibold border-b pb-1">Status de SLA do Chamado</div>
          <div className="flex justify-between items-center gap-2">
            <span>Tempo de Resposta:</span>
            <span
              className={
                responseSla.isResponded
                  ? 'text-emerald-500 font-semibold'
                  : responseSla.status === 'expired'
                    ? 'text-destructive font-bold'
                    : 'font-mono'
              }
            >
              {responseSla.isResponded ? 'Concluído' : responseSla.countdown.text}
            </span>
          </div>
          {responseSla.deadline && (
            <div className="text-[10px] text-muted-foreground">
              Prazo Resposta: {format(responseSla.deadline, 'dd/MM/yyyy HH:mm')}
            </div>
          )}
          <div className="flex justify-between items-center gap-2 pt-1 border-t">
            <span>Tempo de Solução:</span>
            <span
              className={
                solutionSla.isResolvedOrClosed
                  ? 'text-emerald-500 font-semibold'
                  : solutionSla.status === 'expired'
                    ? 'text-destructive font-bold'
                    : 'font-mono'
              }
            >
              {solutionSla.isResolvedOrClosed
                ? 'Encerrado'
                : solutionSla.deadline
                  ? solutionSla.countdown.text
                  : 'Sem prazo'}
            </span>
          </div>
          {solutionSla.deadline && (
            <div className="text-[10px] text-muted-foreground">
              Prazo Solução: {format(solutionSla.deadline, 'dd/MM/yyyy HH:mm')}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
