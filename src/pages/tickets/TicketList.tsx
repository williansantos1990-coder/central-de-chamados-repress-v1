import { useEffect, useState, useMemo } from 'react'
import { ticketService, Ticket } from '@/services/tickets'
import { slaService } from '@/services/sla'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import { SlaResponseBadge, SlaSolutionBadge } from '@/components/sla-risk-badge'
import { buildSlaPolicyMap, SlaPolicyMap } from '@/lib/sla-utils'
import { useAuth } from '@/hooks/use-auth'

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-green-500 hover:bg-green-600 text-white border-transparent' },
  medium: { label: 'Média', color: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' },
  high: { label: 'Alta', color: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent' },
  critical: {
    label: 'Crítica',
    color: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  },
}

const statusMap: Record<string, string> = {
  open: 'Aberto',
  analyzing: 'Analisando',
  waiting_requester: 'Aguardando Req.',
  in_service: 'Em Atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
  canceled: 'Cancelado',
}

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState('')
  const [policyMap, setPolicyMap] = useState<SlaPolicyMap>(new Map())
  const navigate = useNavigate()
  const { profile } = useAuth()

  const isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin'

  useEffect(() => {
    ticketService.getTickets().then(({ data }) => setTickets(data || []))
    slaService.getPolicies().then(({ data }) => {
      if (data) setPolicyMap(buildSlaPolicyMap(data))
    })
  }, [])

  const filtered = tickets.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toString().includes(search),
  )

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID ou Título..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Atualização</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => {
              const isCritical = t.priority === 'critical'
              const isOverdue =
                t.deadline &&
                new Date(t.deadline) < new Date() &&
                !['resolved', 'closed', 'canceled'].includes(t.status)
              return (
                <TableRow
                  key={t.id}
                  className={`cursor-pointer hover:bg-muted/50 ${isCritical || isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  <TableCell className="font-medium">#{t.id}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="truncate">{t.title}</span>
                  </TableCell>
                  <TableCell>{t.requester?.full_name}</TableCell>
                  <TableCell>{t.category?.name}</TableCell>
                  <TableCell>
                    <Badge className={priorityMap[t.priority]?.color} variant="secondary">
                      {priorityMap[t.priority]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusMap[t.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {isAgentOrAdmin && <SlaResponseBadge ticket={t} policyMap={policyMap} />}
                      <SlaSolutionBadge ticket={t} policyMap={policyMap} />
                    </div>
                  </TableCell>
                  <TableCell>{t.assignee?.full_name || '-'}</TableCell>
                  <TableCell>{format(new Date(t.updated_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhum chamado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
