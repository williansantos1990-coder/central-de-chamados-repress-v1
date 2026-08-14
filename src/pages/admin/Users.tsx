import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  userService,
  UserProfile,
  UserRole,
  NewUserPayload,
  ROLE_LABELS,
  ROLE_BADGE_CLASS,
} from '@/services/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'agent', label: 'Atendente' },
  { value: 'requester', label: 'Solicitante' },
]

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  admin: 'Acesso total, pode gerenciar usuários e configurações.',
  agent: 'Atende chamados, altera responsável, prioridade, setor e tipo de serviço.',
  requester: 'Abre chamados e acompanha seus tickets.',
}

const emptyCreateForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'requester' as UserRole,
  sector: '',
  phone: '',
}

export default function Users() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await userService.getAll()
    if (error) {
      toast.error('Erro ao carregar usuários', { description: error.message })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.sector?.toLowerCase().includes(q)
    )
  })

  // ===== CREATE =====
  const openCreate = () => {
    setCreateForm(emptyCreateForm)
    setCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !createForm.full_name.trim() ||
      !createForm.email.trim() ||
      !createForm.password ||
      !createForm.sector.trim() ||
      !createForm.role
    ) {
      toast.error('Preencha todos os campos obrigatórios: Nome, E-mail, Senha, Perfil e Setor.')
      return
    }
    setCreating(true)
    const payload: NewUserPayload = {
      email: createForm.email.trim(),
      password: createForm.password,
      full_name: createForm.full_name.trim(),
      role: createForm.role,
      sector: createForm.sector.trim() || null,
      phone: createForm.phone.trim() || null,
    }
    const { error } = await userService.create(payload)
    setCreating(false)
    if (error) {
      toast.error('Erro ao criar usuário', { description: error.message })
    } else {
      toast.success('Usuário criado com sucesso!')
      setCreateOpen(false)
      loadUsers()
    }
  }

  // ===== EDIT =====
  const openEdit = (u: UserProfile) => {
    setEditTarget(u)
    setEditForm({
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      sector: u.sector || '',
      phone: u.phone || '',
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    if (
      !editForm.full_name?.trim() ||
      !editForm.email?.trim() ||
      !(editForm.sector as string)?.trim() ||
      !editForm.role
    ) {
      toast.error('Preencha todos os campos obrigatórios: Nome, E-mail, Perfil e Setor.')
      return
    }
    setSavingEdit(true)
    const { error } = await userService.update(editTarget.id, {
      full_name: editForm.full_name?.trim(),
      email: editForm.email?.trim(),
      role: editForm.role,
      sector: (editForm.sector as string)?.trim() || null,
      phone: (editForm.phone as string)?.trim() || null,
    })
    setSavingEdit(false)
    if (error) {
      toast.error('Erro ao atualizar usuário', { description: error.message })
    } else {
      toast.success('Usuário atualizado!')
      setEditTarget(null)
      loadUsers()
    }
  }

  // ===== ROLE CHANGE (inline) =====
  const handleRoleChange = async (u: UserProfile, role: UserRole) => {
    if (u.role === role) return
    const { error } = await userService.changeRole(u.id, role)
    if (error) {
      toast.error('Erro ao alterar perfil', { description: error.message })
    } else {
      toast.success(`Perfil alterado para ${ROLE_LABELS[role]}`)
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role } : p)))
    }
  }

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await userService.remove(deleteTarget.id)
    setDeleting(false)
    if (error) {
      toast.error('Erro ao excluir usuário', { description: error.message })
    } else {
      toast.success('Usuário excluído do sistema.')
      setDeleteTarget(null)
      loadUsers()
    }
  }

  const isSelf = (u: UserProfile) => u.id === profile?.id

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o acesso, os perfis e os dados dos usuários da plataforma.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <Input
            placeholder="Buscar por nome, e-mail ou setor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {filtered.length} usuário(s)
          </span>
        </div>
        {loading ? (
          <div className="py-12 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando usuários...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Setor</TableHead>
                <TableHead className="hidden lg:table-cell">Ramal</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{u.full_name}</span>
                        {isSelf(u) && (
                          <span className="text-[10px] text-muted-foreground">Você</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u, v as UserRole)}
                      disabled={isSelf(u)}
                    >
                      <SelectTrigger className="h-7 w-[150px] border-0 p-0 focus:ring-0">
                        <Badge variant="outline" className={ROLE_BADGE_CLASS[u.role]}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {u.sector || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {u.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(u)}
                          disabled={isSelf(u)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário no sistema. Ele poderá entrar com a senha temporária informada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nome completo</Label>
              <Input
                id="c-name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Ex.: João da Silva"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">E-mail</Label>
              <Input
                id="c-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="email@repress.com.br"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-pass">Senha temporária</Label>
              <Input
                id="c-pass"
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <p className="text-xs text-muted-foreground">
                O usuário será solicitado a alterá-la no primeiro acesso.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span>{r.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTION[r.value]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-sector">Setor *</Label>
                <Input
                  id="c-sector"
                  value={createForm.sector}
                  onChange={(e) => setCreateForm({ ...createForm, sector: e.target.value })}
                  placeholder="Ex.: TI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">
                  Ramal{' '}
                  <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="c-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="Ex.: 1042"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados cadastrais de {editTarget?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="e-name">Nome completo</Label>
              <Input
                id="e-name"
                value={(editForm.full_name as string) || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-email">E-mail</Label>
              <Input
                id="e-email"
                type="email"
                value={(editForm.email as string) || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Alterar o e-mail atualiza apenas o perfil. O login utiliza o e-mail original do
                auth.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={(editForm.role as UserRole) || 'requester'}
                onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRole })}
                disabled={editTarget?.id === profile?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="e-sector">Setor *</Label>
                <Input
                  id="e-sector"
                  value={(editForm.sector as string) || ''}
                  onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                  placeholder="Ex.: TI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-phone">
                  Ramal{' '}
                  <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="e-phone"
                  value={(editForm.phone as string) || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Ex.: 1042"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.full_name}</span> (
              {deleteTarget?.email}) do sistema? Esta ação removerá o acesso e todos os dados
              associados e não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
