import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { reportService, AgentProductivity } from '@/services/reports'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Users, CheckCircle2, AlertCircle, TrendingUp, Clock } from 'lucide-react'

export default function Productivity() {
  const { profile } = useAuth()
  const [data, setData] = useState<AgentProductivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportService.getProductivity().then((result) => {
      setData(result ?? [])
      setLoading(false)
    })
  }, [])

  if (profile?.role !== 'admin' && profile?.role !== 'agent') {
    return <Navigate to="/" replace />
  }

  const chartConfig = {
    resolved: { label: 'Resolvidos', color: '#3b82f6' },
    overdue: { label: 'Atrasados', color: '#f97316' },
  }

  const chartData = data.map((a) => ({
    name: a.assignee_name.split(' ')[0],
    resolved: a.total_resolved,
    overdue: a.total_overdue,
  }))

  const totalResolved = data.reduce((sum, a) => sum + a.total_resolved, 0)
  const totalOverdue = data.reduce((sum, a) => sum + a.total_overdue, 0)
  const avgCompliance =
    data.length > 0 ? data.reduce((sum, a) => sum + a.sla_compliance_pct, 0) / data.length : 0

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Produtividade da Equipe</h2>
        <p className="text-muted-foreground">
          Acompanhe o desempenho dos agentes na resolução de chamados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolvidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalOverdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade SLA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompliance.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chamados Resolvidos vs. Atrasados por Agente</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="resolved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Agente</CardTitle>
          <CardDescription>Métricas individuais de produtividade</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              Nenhum dado de produtividade disponível.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.map((agent) => (
                <Card key={agent.assignee_id} className="border-primary/20">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {agent.assignee_name.charAt(0)}
                      </div>
                      <span className="font-semibold">{agent.assignee_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground block">Resolvidos</span>
                        <span className="font-bold text-blue-600">{agent.total_resolved}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground block">Atrasados</span>
                        <span className="font-bold text-orange-600">{agent.total_overdue}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground block">% SLA</span>
                        <span className="font-bold">{agent.sla_compliance_pct.toFixed(0)}%</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground block">Tempo Médio</span>
                        <span className="font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {agent.avg_resolution_hours < 24
                            ? `${agent.avg_resolution_hours.toFixed(1)}h`
                            : `${(agent.avg_resolution_hours / 24).toFixed(1)}d`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
