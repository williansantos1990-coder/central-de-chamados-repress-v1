import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isSlaAtRisk } from '@/lib/sla-utils'
import { Ticket } from '@/services/tickets'

export function SlaRiskBadge({ ticket }: { ticket: Ticket }) {
  if (!isSlaAtRisk(ticket)) return null
  return (
    <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-transparent text-[10px] gap-0.5 px-1.5 py-0 shrink-0">
      <AlertTriangle className="w-2.5 h-2.5" />
      SLA
    </Badge>
  )
}
