import { useEffect, useState } from 'react'
import { slaService, SlaPolicy, Category } from '@/services/sla'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Clock, Zap } from 'lucide-react'
import { SLA_PRIORITY_CONFIG, formatDuration } from '@/lib/sla-utils'

const PRIORITY_BADGES = {
  critical: 'bg-red-500 hover:bg-red-600 text-white',
  high: 'bg-orange-500 hover:bg-orange-600 text-white',
  medium: 'bg-amber-500 hover:bg-amber-600 text-white',
  low: 'bg-emerald-500 hover:bg-emerald-600 text-white',
}

export default function SlaPolicies() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    category_id: '',
    priority: 'low',
    response_time_hours: '8',
    duration_hours: '72',
  })

  const loadData = async () => {
    setLoading(true)
    const [polRes, catRes] = await Promise.all([
      slaService.getPolicies(),
      slaService.getCategories(),
    ])
    setPolicies(polRes.data || [])
    setCategories(catRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePriorityChange = (priority: string) => {
    const config = SLA_PRIORITY_CONFIG[priority]
    setForm((prev) => ({
      ...prev,
      priority,
      response_time_hours: config ? String(config.responseTimeHours) : '8',
      duration_hours: config ? String(config.solutionTimeHours) : '72',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category_id) {
      toast.error('Selecione uma categoria')
      return
    }
    setSaving(true)
    const { error } = await slaService.createPolicy({
      category_id: form.category_id,
      priority: form.priority as any,
      response_time_hours: Number(form.response_time_hours),
      duration_hours: Number(form.duration_hours),
    })
    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar política SLA', { description: error.message })
    } else {
      toast.success('Política de SLA salva!')
      setOpenModal(false)
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta política de SLA?')) return
    const { error } = await slaService.deletePolicy(id)
    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
    } else {
      toast.success('Política excluída')
      loadData()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Políticas de SLA</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os prazos de resposta e solução dos chamados por categoria e prioridade.
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Política
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(SLA_PRIORITY_CONFIG).map(([pKey, pConf]) => (
          <Card key={pKey} className="border-border/60">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Badge className={PRIORITY_BADGES[pKey as keyof typeof PRIORITY_BADGES]}>
                  {pConf.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{pConf.responseLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{pConf.solutionLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Políticas Cadastradas</CardTitle>
          <CardDescription>Regras ativas aplicadas aos chamados da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : policies.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma política cadastrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Tempo de Resposta</TableHead>
                  <TableHead>Tempo de Solução</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.category?.name || 'Geral'}</TableCell>
                    <TableCell>
                      <Badge
                        className={PRIORITY_BADGES[p.priority as keyof typeof PRIORITY_BADGES]}
                      >
                        {SLA_PRIORITY_CONFIG[p.priority]?.label || p.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDuration(p.response_time_hours || 8)}</TableCell>
                    <TableCell>{formatDuration(p.duration_hours)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Política de SLA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={handlePriorityChange} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tempo Resposta (Horas)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.response_time_hours}
                  onChange={(e) => setForm({ ...form, response_time_hours: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo Solução (Horas)</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={form.duration_hours}
                  onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Política'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
