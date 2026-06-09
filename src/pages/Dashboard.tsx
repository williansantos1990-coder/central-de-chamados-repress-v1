import { useEffect, useState } from 'react'
import { ticketService, Ticket } from '@/services/tickets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const priorityColors = { low: '#22c55e', medium: '#0ea5e9', high: '#f97316', critical: '#dc2626' }
const statusColors = {
  open: '#3b82f6',
  analyzing: '#a855f7',
  waiting_requester: '#f59e0b',
  in_service: '#6366f1',
  resolved: '#22c55e',
  closed: '#64748b',
  canceled: '#ef4444',
}

const chartConfig = {
  low: { label: 'Baixa', color: priorityColors.low },
  medium: { label: 'Média', color: priorityColors.medium },
  high: { label: 'Alta', color: priorityColors.high },
  critical: { label: 'Crítica', color: priorityColors.critical },
  open: { label: 'Aberto', color: statusColors.open },
  analyzing: { label: 'Analisando', color: statusColors.analyzing },
  waiting_requester: { label: 'Aguardando Req.', color: statusColors.waiting_requester },
  in_service: { label: 'Em Atendimento', color: statusColors.in_service },
  resolved: { label: 'Resolvido', color: statusColors.resolved },
  closed: { label: 'Fechado', color: statusColors.closed },
  canceled: { label: 'Cancelado', color: statusColors.canceled },
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ticketService.getTickets().then(({ data }) => {
      if (data) setTickets(data)
      setLoading(false)
    })
  }, [])

  if (loading)
    return (
      <div className="animate-pulse flex items-center justify-center py-20 text-muted-foreground">
        Carregando dashboard...
      </div>
    )

  const total = tickets.length
  const inProgress = tickets.filter((t) =>
    ['open', 'analyzing', 'in_service'].includes(t.status),
  ).length
  const resolved = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length
  const delayed = tickets.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      !['resolved', 'closed', 'canceled'].includes(t.status),
  ).length

  const priorityData = Object.entries(priorityColors).map(([key, color]) => ({
    name: key,
    value: tickets.filter((t) => t.priority === key).length,
    fill: color,
  }))

  const statusData = Object.entries(statusColors)
    .map(([key, color]) => ({
      name: key,
      value: tickets.filter((t) => t.status === key).length,
      fill: color,
    }))
    .filter((d) => d.value > 0)

  let onTime = 0
  let overdue = 0
  let hasSlaTickets = false

  tickets.forEach((t) => {
    if (!t.deadline) return
    hasSlaTickets = true
    const deadline = new Date(t.deadline).getTime()

    if (['resolved', 'closed'].includes(t.status)) {
      const updated = new Date(t.updated_at).getTime()
      if (updated <= deadline) {
        onTime++
      } else {
        overdue++
      }
    } else if (t.status !== 'canceled') {
      const now = new Date().getTime()
      if (now > deadline) {
        overdue++
      } else {
        onTime++
      }
    }
  })

  const slaData = hasSlaTickets
    ? [
        { name: 'on_time', value: onTime, fill: '#3b82f6' },
        { name: 'overdue', value: overdue, fill: '#f97316' },
      ].filter((d) => d.value > 0)
    : []

  const slaChartConfig = {
    on_time: { label: 'No Prazo', color: '#3b82f6' },
    overdue: { label: 'Atrasado', color: '#f97316' },
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{delayed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Chamados por Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={priorityData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => chartConfig[v as keyof typeof chartConfig]?.label || v}
                />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full flex items-center justify-center"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {tickets.slice(0, 5).map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      #{ticket.id} - {ticket.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {ticket.requester?.full_name} •{' '}
                      {format(new Date(ticket.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {chartConfig[ticket.status as keyof typeof chartConfig]?.label}
                    </Badge>
                  </div>
                </Link>
              ))}
              {tickets.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum chamado encontrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cumprimento de SLA</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSlaTickets ? (
              <ChartContainer
                config={slaChartConfig}
                className="h-[300px] w-full flex items-center justify-center"
              >
                <PieChart>
                  <Pie
                    data={slaData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {slaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground p-4">
                <div className="bg-muted/50 rounded-lg p-6 border-dashed border-2">
                  <p>Nenhum dado de SLA disponível para acompanhamento.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
