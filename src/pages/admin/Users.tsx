import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function Users() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Módulo em desenvolvimento. Em breve você poderá alterar as permissões de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            Funcionalidade disponível na próxima versão.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
