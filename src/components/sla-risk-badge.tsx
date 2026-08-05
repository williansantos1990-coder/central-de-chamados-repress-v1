import { AlertTriangle, Clock, AlarmClock, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTicketResponseSla, getTicketSolutionSla, SlaPolicyMap } from '@/lib/sla-utils'
import { Ticket } from '@/services/tickets'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SlaPolicy } from '@/services/sla'

export function SlaRiskBadge({ ticket }: { ticket: Ticket }) {
  const responseSla = getTicketResponseSla(ticket)
  const solutionSla = getTicketSolutionSla(ticket)

  const isResponseRisk = responseSla.status === 'warning' || responseSla.status === 'expired'
  const isSolutionRisk = solutionSla.status === 'warning' || solutionSla.status === 'expired'

  if (!isResponseRisk && !isSolutionRisk) return null

  const isExpired = responseSla.status === 'expired' || solutionSla.status === 'expired'

  if (isExpired) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-destructive hover:bg-destructive text-destructive-foreground border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
              SLA Vencido
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Prazo de SLA excedido</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium animate-fade-in">
            <AlertTriangle className="w-2.5 h-2.5" />
            {isResponseRisk ? 'Atenção Resposta' : 'Atenção Solução'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isResponseRisk
              ? 'Atenção: Limite de tempo de resposta se aproximando'
              : 'Atenção: Prazo de solução próximo do limite'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SlaResponseBadge({
  ticket,
  policyMap,
}: {
  ticket: Ticket
  policyMap?: SlaPolicyMap | SlaPolicy[] | any[]
}) {
  const responseSla = getTicketResponseSla(ticket, policyMap)

  if (responseSla.isResponded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              <Check className="w-2.5 h-2.5" />
              Resposta Concluída
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Primeira resposta realizada com sucesso.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (responseSla.status === 'on_time') return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium border-transparent text-white ${
              responseSla.status === 'expired'
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-600 animate-fade-in'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            {responseSla.status === 'expired' ? 'Resposta Vencida' : 'Atenção Resposta'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[220px]">
            {responseSla.status === 'expired'
              ? 'Tempo de resposta excedido — limite interno para o primeiro atendimento foi atingido.'
              : 'Atenção: tempo limite de resposta se aproximando.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SlaSolutionBadge({
  ticket,
  policyMap,
}: {
  ticket: Ticket
  policyMap?: SlaPolicyMap | SlaPolicy[] | any[]
}) {
  const solutionSla = getTicketSolutionSla(ticket, policyMap)

  if (solutionSla.isResolvedOrClosed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium">
              <Check className="w-2.5 h-2.5" />
              Solução Concluída
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Chamado resolvido ou encerrado.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (solutionSla.status === 'on_time' || solutionSla.status === 'no_deadline') return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium border-transparent text-white ${
              solutionSla.status === 'expired'
                ? 'bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse'
                : 'bg-amber-500 hover:bg-amber-600 animate-fade-in'
            }`}
          >
            <AlarmClock className="w-2.5 h-2.5" />
            {solutionSla.status === 'expired' ? 'Solução Vencida' : 'Atenção Solução'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[220px]">
            {solutionSla.status === 'expired'
              ? 'Prazo de solução excedido — deadline final para resolução do chamado ultrapassado.'
              : 'Atenção: prazo de solução se aproximando do limite.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
