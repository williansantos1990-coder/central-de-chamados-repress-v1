import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ticketService, Ticket } from '@/services/tickets'
import { commentService } from '@/services/comments'
import { activityLogService } from '@/services/activity-log'
import { categoryService, Category } from '@/services/categories'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/rich-text-editor'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { SlaRiskBadge } from '@/components/sla-risk-badge'
import { SlaCountdown } from '@/components/sla-countdown'

const statusMap: Record<string, string> = {
  open: 'Aberto',
  analyzing: 'Analisando',
  waiting_requester: 'Aguardando Req.',
  in_service: 'Em Atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
  canceled: 'Cancelado',
}

const serviceTypeMap: Record<string, string> = {
  suporte_tecnico: 'Suporte Técnico',
  manutencao: 'Manutenção',
  configuracao: 'Configuração',
  acesso_permissao: 'Acesso / Permissão',
  duvida: 'Dúvida',
  nova_funcionalidade: 'Nova Funcionalidade',
}

const serviceTypeOptions = [
  { value: 'suporte_tecnico', label: 'Suporte Técnico' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'configuracao', label: 'Configuração' },
  { value: 'acesso_permissao', label: 'Acesso / Permissão' },
  { value: 'duvida', label: 'Dúvida' },
  { value: 'nova_funcionalidade', label: 'Nova Funcionalidade' },
]

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-green-500 hover:bg-green-600 text-white border-transparent' },
  medium: { label: 'Média', color: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' },
  high: { label: 'Alta', color: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent' },
  critical: {
    label: 'Crítica',
    color: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  },
}

interface AssigneeProfile {
  id: string
  full_name: string
  email: string
  role: string
}

export default function TicketDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [assignees, setAssignees] = useState<AssigneeProfile[]>([])

  const fetchTicket = async () => {
    if (!id) return
    const { data } = await ticketService.getTicket(Number(id))
    if (data) setTicket(data)
    const { data: cData } = await commentService.getComments(Number(id))
    if (cData) setComments(cData)
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  useEffect(() => {
    categoryService.getCategories().then(({ data }) => setCategories(data || []))
    ticketService.getAssignees().then(({ data }) => setAssignees(data || []))
  }, [])

  const handleAddComment = async () => {
    const plainText = newComment.replace(/<[^>]*>/g, '').trim()
    if (!plainText || !user || !ticket) return
    const { error } = await commentService.addComment({
      ticket_id: ticket.id,
      user_id: user.id,
      content: newComment,
      is_internal: false,
    })
    if (!error) {
      setNewComment('')
      fetchTicket()
    } else {
      toast.error('Erro ao adicionar comentário')
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!ticket) return
    const { error } = await ticketService.updateTicket(ticket.id, { status: status as any })
    if (!error) {
      toast.success('Status atualizado')
      fetchTicket()
    }
  }

  const handlePriorityChange = async (priority: string) => {
    if (!ticket) return

    const { error } = await ticketService.updateTicket(ticket.id, {
      priority: priority as any,
    })

    if (!error) {
      toast.success('Prioridade atualizada')
      fetchTicket()
    } else {
      toast.error('Erro ao atualizar prioridade', { description: error.message })
    }
  }

  const handleServiceTypeChange = async (serviceType: string) => {
    if (!ticket || !user) return
    const oldValue = ticket.service_type
      ? serviceTypeMap[ticket.service_type] || ticket.service_type
      : 'Não informado'
    const newValue = serviceTypeMap[serviceType] || serviceType

    const { error } = await ticketService.updateTicket(ticket.id, {
      service_type: serviceType,
    })

    if (!error) {
      await activityLogService.logActivity({
        ticket_id: ticket.id,
        user_id: user.id,
        action_type: 'update',
        old_value: oldValue,
        new_value: newValue,
      })
      toast.success('Tipo de serviço atualizado')
      fetchTicket()
    } else {
      toast.error('Erro ao atualizar tipo de serviço', { description: error.message })
    }
  }

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!ticket || !user) return
    const actualId = newAssigneeId === 'unassigned' ? null : newAssigneeId
    const oldAssigneeName = ticket.assignee?.full_name || 'Não atribuído'
    const newAssignee = assignees.find((a) => a.id === actualId)
    const newAssigneeName = newAssignee?.full_name || 'Não atribuído'

    const { error } = await ticketService.updateTicket(ticket.id, { assignee_id: actualId })

    if (!error) {
      await activityLogService.logActivity({
        ticket_id: ticket.id,
        user_id: user.id,
        action_type: 'update',
        old_value: oldAssigneeName,
        new_value: newAssigneeName,
      })
      toast.success('Responsável atualizado')
      fetchTicket()
    } else {
      toast.error('Erro ao atualizar responsável', { description: error.message })
    }
  }

  const handleCategoryChange = async (categoryId: string) => {
    if (!ticket || !user) return
    const oldName = ticket.category?.name || 'Não informado'
    const newCat = categories.find((c) => c.id === categoryId)
    const newName = newCat?.name || 'Não informado'

    const { error } = await ticketService.updateTicket(ticket.id, { category_id: categoryId })

    if (!error) {
      await activityLogService.logActivity({
        ticket_id: ticket.id,
        user_id: user.id,
        action_type: 'update',
        old_value: oldName,
        new_value: newName,
      })
      toast.success('Setor atualizado')
      fetchTicket()
    } else {
      toast.error('Erro ao atualizar setor', { description: error.message })
    }
  }

  if (!ticket)
    return (
      <div className="animate-pulse flex items-center justify-center py-20 text-muted-foreground">
        Carregando detalhes...
      </div>
    )

  const isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin'
  const isResolvedOrClosed = ['resolved', 'closed', 'canceled'].includes(ticket.status)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground font-mono text-sm">#{ticket.id}</span>
                <Badge variant="outline" className="uppercase tracking-wider text-[10px]">
                  {statusMap[ticket.status]}
                </Badge>
              </div>
              <CardTitle className="text-2xl leading-tight">{ticket.title}</CardTitle>
            </div>
            {isAgentOrAdmin && (
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px] shrink-0">
                  <SelectValue placeholder="Alterar Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="analyzing">Analisando</SelectItem>
                  <SelectItem value="waiting_requester">Aguardando Req.</SelectItem>
                  <SelectItem value="in_service">Em Atendimento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm rich-content">
              {ticket.description.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
              ) : (
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Linha do Tempo
            <Badge variant="secondary" className="font-normal">
              {comments.length}
            </Badge>
          </h3>
          <div className="space-y-4">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border flex gap-4 transition-all hover:shadow-md ${c.is_internal ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200' : 'bg-card'}`}
              >
                <Avatar className="w-10 h-10 border shadow-sm">
                  <AvatarImage src={c.user?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {c.user?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      {c.user?.full_name}
                      <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                        {c.user?.role}
                      </span>
                    </span>
                    <span
                      className="text-xs text-muted-foreground"
                      title={format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}
                    >
                      {formatDistanceToNow(new Date(c.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {c.is_internal && (
                    <Badge
                      variant="secondary"
                      className="mb-2 text-[10px] bg-amber-200/50 text-amber-800 border-amber-300"
                    >
                      Nota Interna (Apenas Agentes)
                    </Badge>
                  )}
                  <div className="text-sm leading-relaxed mt-2 rich-content">
                    {c.content.includes('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: c.content }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Card className="shadow-sm mt-8 border-primary/20">
            <CardContent className="p-4 space-y-4">
              <RichTextEditor
                placeholder="Adicione um comentário ou nota..."
                value={newComment}
                onChange={setNewComment}
                minHeight="120px"
              />
              <div className="flex items-center justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.replace(/<[^>]*>/g, '').trim()}
                >
                  Enviar Comentário
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="shadow-sm sticky top-20">
          <CardHeader>
            <CardTitle className="text-lg border-b pb-2">Detalhes do Chamado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Solicitante
              </span>
              <div className="font-medium">{ticket.requester?.full_name}</div>
              <div className="text-xs text-muted-foreground">{ticket.requester?.email}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Responsável
              </span>
              {isAgentOrAdmin && !isResolvedOrClosed ? (
                <Select
                  value={ticket.assignee_id || 'unassigned'}
                  onValueChange={handleAssigneeChange}
                >
                  <SelectTrigger className="h-8 w-full text-xs font-medium">
                    <SelectValue placeholder="Selecione o responsável..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-xs italic text-muted-foreground">
                      Não atribuído
                    </SelectItem>
                    {assignees.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id} className="text-xs">
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium">{ticket.assignee?.full_name || 'Não atribuído'}</div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Setor
              </span>
              {isAgentOrAdmin && !isResolvedOrClosed ? (
                <Select value={ticket.category_id} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-8 w-full text-xs font-medium">
                    <SelectValue placeholder="Selecione o setor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium">{ticket.category?.name}</div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Tipo de Serviço
              </span>
              {isAgentOrAdmin && !isResolvedOrClosed ? (
                <Select value={ticket.service_type || ''} onValueChange={handleServiceTypeChange}>
                  <SelectTrigger className="h-8 w-full text-xs font-medium">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium">
                  {ticket.service_type
                    ? serviceTypeMap[ticket.service_type] || ticket.service_type
                    : 'Não informado'}
                </div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Prioridade
              </span>
              {isAgentOrAdmin && !isResolvedOrClosed ? (
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${priorityMap[ticket.priority]?.color.split(' ')[0]}`}
                      />
                      <span>{priorityMap[ticket.priority]?.label}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Baixa
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Média
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                        Crítica
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={priorityMap[ticket.priority]?.color} variant="secondary">
                  {priorityMap[ticket.priority]?.label}
                </Badge>
              )}
            </div>

            <SlaCountdown ticket={ticket} comments={comments} isAgentOrAdmin={isAgentOrAdmin} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
