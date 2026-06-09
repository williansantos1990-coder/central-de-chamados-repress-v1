import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { slaService, Category, TicketPriority } from '@/services/sla'
import { Trash2, Plus } from 'lucide-react'

const priorityMap: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

export default function SlaPolicies() {
  const { profile } = useAuth()
  const [policies, setPolicies] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TicketPriority | ''>('')
  const [duration, setDuration] = useState('')

  const loadData = async () => {
    setLoading(true)
    const [policiesRes, categoriesRes] = await Promise.all([
      slaService.getPolicies(),
      slaService.getCategories(),
    ])
    if (policiesRes.data) setPolicies(policiesRes.data)
    if (categoriesRes.data) setCategories(categoriesRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !priority || !duration) return

    const { error } = await slaService.createPolicy({
      category_id: categoryId,
      priority,
      duration_hours: parseInt(duration),
    })

    if (error) {
      if (error.code === '23505') {
        toast.error('Já existe uma política de SLA para esta categoria e prioridade.')
      } else {
        toast.error('Erro ao salvar política SLA.', { description: error.message })
      }
    } else {
      toast.success('Política SLA adicionada com sucesso.')
      setCategoryId('')
      setPriority('')
      setDuration('')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta política de SLA?')) return
    const { error } = await slaService.deletePolicy(id)
    if (error) {
      toast.error('Erro ao remover política.', { description: error.message })
    } else {
      toast.success('Política removida com sucesso.')
      loadData()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Políticas de SLA</h2>
          <p className="text-muted-foreground">
            Configure o prazo limite (em horas) para os chamados baseando-se na categoria e
            prioridade.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Nova Política SLA</CardTitle>
            <CardDescription>Defina as regras de prazo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger id="category">
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
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as TicketPriority)}
                  required
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (Horas)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 24"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Políticas Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : policies.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                Nenhuma política de SLA configurada.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Prazo (Horas)</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.category?.name}</TableCell>
                        <TableCell>{priorityMap[p.priority]}</TableCell>
                        <TableCell>{p.duration_hours}h</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(p.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
