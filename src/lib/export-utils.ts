import { Ticket } from '@/services/tickets'
import { isSlaOverdue } from './sla-utils'

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

export function exportSlaToCsv(tickets: Ticket[]) {
  const headers = [
    'Ticket ID',
    'Título',
    'Setor',
    'Prioridade',
    'Solicitante',
    'Responsável',
    'Data de Criação',
    'Prazo (Deadline)',
    'Data de Resolução',
    'Status do SLA',
  ]

  const rows = tickets.map((t) => {
    const isResolved = ['resolved', 'closed'].includes(t.status)
    const resolutionDate = isResolved ? t.updated_at : ''
    const slaStatus = !t.deadline ? 'Sem prazo' : isSlaOverdue(t) ? 'Atrasado' : 'No Prazo'

    return [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.category?.name || '').replace(/"/g, '""')}"`,
      priorityLabels[t.priority] || t.priority,
      `"${(t.requester?.full_name || '').replace(/"/g, '""')}"`,
      `"${(t.assignee?.full_name || 'Não atribuído').replace(/"/g, '""')}"`,
      new Date(t.created_at).toLocaleString('pt-BR'),
      t.deadline ? new Date(t.deadline).toLocaleString('pt-BR') : '',
      resolutionDate ? new Date(resolutionDate).toLocaleString('pt-BR') : '',
      slaStatus,
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-sla-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
