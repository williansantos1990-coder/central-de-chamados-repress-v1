import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerenciais</CardTitle>
          <CardDescription>
            Módulo em desenvolvimento. Aqui ficarão os relatórios de SLA e desempenho.
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
