import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ticketService, Ticket } from '@/services/tickets'
import { commentService } from '@/services/comments'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

const statusMap: Record<string, string> = {
  open: 'Aberto',
  analyzing: 'Analisando',
  waiting_requester: 'Aguardando Req.',
  in_service: 'Em Atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
  canceled: 'Cancelado',
}

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-green-500 hover:bg-green-600 text-white border-transparent' },
  medium: { label: 'Média', color: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' },
  high: { label: 'Alta', color: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent' },
  critical: {
    label: 'Crítica',
    color: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  },
}

export default function TicketDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)

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

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !ticket) return
    const { error } = await commentService.addComment({
      ticket_id: ticket.id,
      user_id: user.id,
      content: newComment,
      is_internal: isInternal,
    })
    if (!error) {
      setNewComment('')
      setIsInternal(false)
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

    const created = new Date(ticket.created_at)
    let deadline = new Date(created)
    if (priority === 'low') deadline.setHours(deadline.getHours() + 72)
    else if (priority === 'medium') deadline.setHours(deadline.getHours() + 48)
    else if (priority === 'high') deadline.setHours(deadline.getHours() + 24)
    else deadline.setHours(deadline.getHours() + 4)

    const { error } = await ticketService.updateTicket(ticket.id, {
      priority: priority as any,
      deadline: deadline.toISOString(),
    })
    if (!error) {
      toast.success('Prioridade atualizada')
      fetchTicket()
    } else {
      toast.error('Erro ao atualizar prioridade', { description: error.message })
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

  // Calculate SLA Progress
  let progress = 100
  let slaText = 'Sem prazo'
  if (ticket.deadline && !isResolvedOrClosed) {
    const created = new Date(ticket.created_at).getTime()
    const deadline = new Date(ticket.deadline).getTime()
    const now = new Date().getTime()
    const totalDuration = deadline - created
    const elapsed = now - created
    progress = Math.max(0, Math.min(100, 100 - (elapsed / totalDuration) * 100))
    slaText = formatDistanceToNow(new Date(ticket.deadline), { addSuffix: true, locale: ptBR })
  }

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
            <div className="prose dark:prose-invert max-w-none text-sm">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mt-2">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="shadow-sm mt-8 border-primary/20">
            <CardContent className="p-4 space-y-4">
              <Textarea
                placeholder="Adicione um comentário ou nota..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                {isAgentOrAdmin ? (
                  <div className="flex items-center gap-2">
                    <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                    <Label htmlFor="internal" className="cursor-pointer">
                      Marcar como Interno
                    </Label>
                  </div>
                ) : (
                  <div />
                )}
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
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
              <div className="font-medium">{ticket.assignee?.full_name || 'Não atribuído'}</div>
              {isAgentOrAdmin && !ticket.assignee_id && !isResolvedOrClosed && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() =>
                    ticketService
                      .updateTicket(ticket.id, { assignee_id: user?.id as string })
                      .then(fetchTicket)
                  }
                >
                  Atribuir a mim
                </Button>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">
                Categoria
              </span>
              <div className="font-medium">{ticket.category?.name}</div>
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

            <div className="pt-4 border-t border-dashed">
              <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-2">
                SLA / Prazo de Resolução
              </span>
              {ticket.deadline ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{isResolvedOrClosed ? 'Encerrado' : 'Tempo Restante'}</span>
                    <span
                      className={
                        !isResolvedOrClosed && progress === 0 ? 'text-destructive font-bold' : ''
                      }
                    >
                      {slaText}
                    </span>
                  </div>
                  <Progress
                    value={isResolvedOrClosed ? 100 : progress}
                    className={`h-2 ${!isResolvedOrClosed && progress === 0 ? 'bg-destructive/20 [&>div]:bg-destructive' : ''}`}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    Prazo: {format(new Date(ticket.deadline), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">Sem prazo definido</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
