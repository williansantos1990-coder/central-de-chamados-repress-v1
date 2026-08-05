import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AgentProductivity, reportService } from '@/services/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { CheckCircle2, AlertCircle, Gauge, Timer, Users } from 'lucide-react'
import { formatDuration } from '@/lib/sla-utils'

const chartConfig = {
  resolved: { label: 'Resolvidos', color: '#3b82f6' },
  overdue: { label: 'Atrasados', color: '#f97316' },
}

export default function Reports() {
  const [agents, setAgents] = useState<AgentProductivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportService.getProductivity().then((data) => {
      setAgents(data ?? [])
      setLoading(false)
    })
  }, [])

  const totalResolved = agents.reduce((sum, a) => sum + a.total_resolved, 0)
  const totalOverdue = agents.reduce((sum, a) => sum + a.total_overdue, 0)
  const totalAssigned = agents.reduce((sum, a) => sum + a.total_assigned, 0)
  const overallSla = totalResolved > 0 ? ((totalResolved - totalOverdue) / totalResolved) * 100 : 0
  const avgResolution =
    agents.length > 0
      ? agents.reduce((sum, a) => sum + a.avg_resolution_hours, 0) / agents.length
      : 0

  const chartData = agents.map((a) => ({
    name: a.assignee_name.split(' ')[0],
    resolved: a.total_resolved,
    overdue: a.total_overdue,
  }))

  const isEmpty = !loading && agents.length === 0

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Relatórios de Produtividade</h2>
        <p className="text-muted-foreground">
          Acompanhe o desempenho da equipe de suporte na resolução de chamados.
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
            <CardTitle className="text-sm font-medium">Total Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalOverdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de SLA</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallSla.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(avgResolution)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Carregando dados...
              </CardContent>
            </Card>
          ) : isEmpty ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                Nenhum dado de produtividade disponível.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resolvidos vs Atrasados por Agente</CardTitle>
                  <CardDescription>Comparativo de produtividade da equipe.</CardDescription>
                </CardHeader>
                <CardContent>
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
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="resolved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="overdue" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visão Geral da Equipe</CardTitle>
                  <CardDescription>Métricas consolidadas de todos os agentes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="w-4 h-4" />
                        Agentes Ativos
                      </div>
                      <div className="text-2xl font-bold">{agents.length}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Total Atribuídos
                      </div>
                      <div className="text-2xl font-bold">{totalAssigned}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Gauge className="w-4 h-4" />
                        Conformidade SLA
                      </div>
                      <div className="text-2xl font-bold">{overallSla.toFixed(1)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtividade por Agente</CardTitle>
              <CardDescription>
                Métricas detalhadas de desempenho individual na resolução de chamados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>
              ) : isEmpty ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  Nenhum dado de produtividade disponível. Atribua chamados a agentes para
                  visualizar métricas.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agente</TableHead>
                        <TableHead className="text-center">Atribuídos</TableHead>
                        <TableHead className="text-center">Resolvidos</TableHead>
                        <TableHead className="text-center">Atrasados</TableHead>
                        <TableHead className="text-center">SLA Compliance</TableHead>
                        <TableHead className="text-center">Tempo Médio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((a) => (
                        <TableRow key={a.assignee_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={a.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {a.assignee_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{a.assignee_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {a.assignee_email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{a.total_assigned}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-500 hover:bg-blue-500 text-white border-transparent">
                              {a.total_resolved}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {a.total_overdue > 0 ? (
                              <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-transparent">
                                {a.total_overdue}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={a.sla_compliance_pct}
                                className={`h-2 w-20 ${a.sla_compliance_pct < 50 ? '[&>div]:bg-destructive' : ''}`}
                              />
                              <span className="text-xs font-medium">
                                {a.sla_compliance_pct.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {formatDuration(a.avg_resolution_hours)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
