import { AlertTriangle, Clock, AlarmClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  isSlaAtRisk,
  isSlaOverdue,
  getResponseTimeHours,
  isResponseTimeAtRisk,
  isResponseTimeOverdue,
  isSolutionTimeAtRisk,
  isSolutionTimeOverdue,
  SlaPolicyMap,
} from '@/lib/sla-utils'
import { Ticket } from '@/services/tickets'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function SlaRiskBadge({ ticket }: { ticket: Ticket }) {
  const atRisk = isSlaAtRisk(ticket)
  const overdue = isSlaOverdue(ticket)

  if (!atRisk && !overdue) return null

  if (overdue) {
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

  const isResponseRisk = ['open', 'analyzing'].includes(ticket.status)
  const responseHours = getResponseTimeHours(ticket.priority)
  const responseMins = Math.round(responseHours * 60)

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
              ? `Atenção: Limite de resposta (${responseMins}min) se aproximando`
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
  policyMap: SlaPolicyMap
}) {
  const atRisk = isResponseTimeAtRisk(ticket, policyMap)
  const overdue = isResponseTimeOverdue(ticket, policyMap)
  if (!atRisk && !overdue) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium border-transparent text-white ${
              overdue
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600 animate-fade-in'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            Tempo de Resposta
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[220px]">
            {overdue
              ? 'Tempo de resposta excedido — limite interno para o primeiro atendimento ao solicitante foi atingido.'
              : 'Atenção: tempo limite de resposta (primeiro atendimento ao solicitante) se aproximando.'}
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
  policyMap: SlaPolicyMap
}) {
  const atRisk = isSolutionTimeAtRisk(ticket, policyMap)
  const overdue = isSolutionTimeOverdue(ticket, policyMap)
  if (!atRisk && !overdue) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`text-[10px] gap-1 px-1.5 py-0 shrink-0 font-medium border-transparent text-white ${
              overdue
                ? 'bg-destructive hover:bg-destructive text-destructive-foreground animate-pulse'
                : 'bg-amber-500 hover:bg-amber-600 animate-fade-in'
            }`}
          >
            <AlarmClock className="w-2.5 h-2.5" />
            Tempo de Solução
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[220px]">
            {overdue
              ? 'Prazo de solução excedido — deadline final para resolução do chamado ultrapassado.'
              : 'Atenção: prazo de solução (deadline final para resolução) se aproximando do limite.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
