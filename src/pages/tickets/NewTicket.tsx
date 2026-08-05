import { useEffect, useState } from 'react'
import { ticketService } from '@/services/tickets'
import { categoryService, Category } from '@/services/categories'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { SLA_PRIORITY_CONFIG, getSolutionTimeHours } from '@/lib/sla-utils'
import { Clock, ShieldAlert, Info } from 'lucide-react'

export default function NewTicket() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'low',
  })

  useEffect(() => {
    categoryService.getCategories().then(({ data }) => setCategories(data || []))
  }, [])

  const selectedSla = SLA_PRIORITY_CONFIG[form.priority]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    const solutionHours = getSolutionTimeHours(form.priority)
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + solutionHours)

    const { data, error } = await ticketService.createTicket({
      ...form,
      requester_id: user.id,
      deadline: deadline.toISOString(),
      priority: form.priority as any,
    })

    setLoading(false)
    if (error) {
      toast.error('Erro ao criar chamado', { description: error.message })
    } else {
      toast.success('Chamado criado com sucesso!')
      navigate(`/tickets/${data.id}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle>Novo Chamado</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Resumo breve do problema..."
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={7}
                placeholder="Descreva os detalhes da sua solicitação..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade / Criticidade</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (Ajustes / Dúvidas simples)</SelectItem>
                    <SelectItem value="medium">Média (Impacta um usuário)</SelectItem>
                    <SelectItem value="high">Alta (Impacta setor inteiro)</SelectItem>
                    <SelectItem value="critical">
                      Crítica (Sistema parado / Impacto geral)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSla && (
              <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-4 space-y-1.5 transition-all animate-fade-in">
                <div className="flex items-center gap-2 font-medium text-blue-950 dark:text-blue-200">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{selectedSla.solutionLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{selectedSla.responseLabel}</span>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 bg-muted/50 py-4 border-t">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Abrir Chamado'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
