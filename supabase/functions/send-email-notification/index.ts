import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = 'suporte@ti.repress.com.br'
const FROM_NAME = 'Central de Chamados Repress'

// Diagnóstico de carga do segredo da Resend (AÇÃO REQUERIDA 3)
console.log(
  'RESEND_API_KEY carregada:',
  RESEND_API_KEY ? 'SIM (tamanho ' + RESEND_API_KEY.length + ')' : 'NÃO',
)
if (!RESEND_API_KEY) {
  console.error(
    '[send-email-notification] RESEND_API_KEY NÃO encontrada nos segredos — a função não conseguirá enviar e-mails.',
  )
}

// Bypass de auto-bloqueio para fins de teste/revisão: este e-mail recebe
// TODAS as notificações, mesmo quando é Solicitante = Atendente (autor da ação).
const BYPASS_AUTO_BLOCK_EMAIL = 'willian.santos1990@gmail.com' // case-insensitive matching handled below
const bypassEmail = (e: string | undefined) => !!e && e.toLowerCase() === BYPASS_AUTO_BLOCK_EMAIL

interface SendNotificationPayload {
  event: 'new_ticket' | 'assignment' | 'status_change' | 'comment' | 'redirection' | 'resolution'
  ticket_id: number
  actor_id?: string // profile id of user who made the action
  details?: {
    old_status?: string
    new_status?: string
    old_assignee_name?: string
    new_assignee_name?: string
    comment_content?: string
    is_internal?: boolean
    redirect_from?: string
    redirect_to?: string
  }
}

const statusMap: Record<string, string> = {
  open: 'Aberto',
  analyzing: 'Analisando',
  waiting_requester: 'Aguardando Solicitante',
  in_service: 'Em Atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
  canceled: 'Cancelado',
}

const priorityMap: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

async function sendResendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return { error: 'RESEND_API_KEY missing' }
  }

  const validEmails = to.filter((e) => e && e.trim() !== '')
  if (validEmails.length === 0) {
    return { ok: true, skipped: 'No valid recipients' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: validEmails,
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Resend API error:', data)
      console.error('Falha no envio de e-mail via Resend (status ' + res.status + ').', {
        to: validEmails,
        subject,
      })
      return { error: data }
    }
    console.log('E-mail enviado com sucesso via Resend.', {
      to: validEmails,
      subject,
      id: data?.id,
    })
    return { ok: true, data }
  } catch (err) {
    console.error('Error calling Resend API:', err)
    console.error('Exceção ao enviar e-mail via Resend.', {
      to: validEmails,
      subject,
      err: String(err),
    })
    return { error: String(err) }
  }
}

function renderEmailTemplate(title: string, contentHtml: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; color: #172b4d; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #0052cc; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.2px; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .ticket-card { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; }
        .ticket-card p { margin: 6px 0; font-size: 14px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #e2e8f0; color: #334155; }
        .badge-open { background: #dbeafe; color: #1e40af; }
        .badge-resolved { background: #dcfce7; color: #166534; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #0052cc; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Central de Chamados Repress</h1>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          Central de Atendimento TI Repress • Mensagem automática, não responda diretamente a este e-mail.
        </div>
      </div>
    </body>
    </html>
  `
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: SendNotificationPayload = await req.json()
    const { event, ticket_id, actor_id, details } = payload

    // Diagnóstico de invocação (AÇÃO REQUERIDA 3)
    console.log('send-email-notification chamada', { event, ticket_id, actor_id })

    if (!ticket_id) {
      return new Response(JSON.stringify({ error: 'ticket_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch ticket details with relations
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!requester_id(id, full_name, email),
        assignee:profiles!assignee_id(id, full_name, email),
        category:categories(id, name)
      `)
      .eq('id', ticket_id)
      .single()

    if (ticketErr || !ticket) {
      console.error('Ticket not found:', ticketErr)
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 444,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch SLA policies for context if available
    let responseHoursText = 'Não definido'
    let solutionHoursText = 'Não definido'

    if (ticket.category_id) {
      const { data: slaPolicy } = await supabase
        .from('sla_policies')
        .select('*')
        .eq('category_id', ticket.category_id)
        .eq('priority', ticket.priority)
        .maybeSingle()

      if (slaPolicy) {
        if (slaPolicy.response_time_hours) {
          responseHoursText = `${slaPolicy.response_time_hours} hora(s)`
        }
        if (slaPolicy.duration_hours) {
          solutionHoursText = `${slaPolicy.duration_hours} hora(s)`
        }
      }
    }

    // Default SLA fallback if not in custom policies table
    if (solutionHoursText === 'Não definido') {
      const defaultSlaMap: Record<string, { resp: string; sol: string }> = {
        low: { resp: '8 horas', sol: '48 horas' },
        medium: { resp: '4 horas', sol: '24 horas' },
        high: { resp: '2 horas', sol: '8 horas' },
        critical: { resp: '1 hora', sol: '4 horas' },
      }
      if (defaultSlaMap[ticket.priority]) {
        responseHoursText = defaultSlaMap[ticket.priority].resp
        solutionHoursText = defaultSlaMap[ticket.priority].sol
      }
    }

    const requesterEmail = ticket.requester?.email
    const requesterName = ticket.requester?.full_name || 'Solicitante'
    const assigneeEmail = ticket.assignee?.email
    const assigneeName = ticket.assignee?.full_name || 'Não atribuído'

    const results: any[] = []

    // --- TRIGGER 1: Novo Chamado ---
    if (event === 'new_ticket') {
      // 1A. Confirmação ao Solicitante
      if (requesterEmail) {
        const html = renderEmailTemplate(
          `Chamado #${ticket.id} Aberto com Sucesso`,
          `
            <h2>Seu chamado foi aberto!</h2>
            <p>Olá <strong>${requesterName}</strong>, recebemos a sua solicitação com o número <strong>#${ticket.id}</strong>.</p>
            
            <div class="ticket-card">
              <p><strong>Título:</strong> ${ticket.title}</p>
              <p><strong>Setor:</strong> ${ticket.category?.name || 'Geral'}</p>
              <p><strong>Prioridade:</strong> ${priorityMap[ticket.priority] || ticket.priority}</p>
              <p><strong>Prazo Máximo de Resposta:</strong> ${responseHoursText}</p>
              <p><strong>Prazo Máximo de Solução:</strong> ${solutionHoursText}</p>
            </div>

            <p>Nossa equipe técnica já foi notificada e em breve dará andamento ao seu atendimento.</p>
          `,
        )
        const res = await sendResendEmail(
          [requesterEmail],
          `[Chamado #${ticket.id}] Confirmação de Abertura - ${ticket.title}`,
          html,
        )
        results.push({ target: 'requester', res })
      }

      // 1B. Alerta para Atendentes / Admins
      const { data: staffMembers } = await supabase
        .from('profiles')
        .select('email')
        .in('role', ['admin', 'agent'])

      const staffEmails = (staffMembers || [])
        .map((s) => s.email)
        .filter((e) => e && (bypassEmail(e) || e !== requesterEmail))

      if (staffEmails.length > 0) {
        const staffHtml = renderEmailTemplate(
          `Novo Chamado #${ticket.id} - ${ticket.title}`,
          `
            <h2>Alerta de Nova Demanda</h2>
            <p>Um novo chamado foi aberto no sistema por <strong>${requesterName}</strong>.</p>
            
            <div class="ticket-card">
              <p><strong>Chamado:</strong> #${ticket.id} - ${ticket.title}</p>
              <p><strong>Solicitante:</strong> ${requesterName} (${requesterEmail || ''})</p>
              <p><strong>Setor:</strong> ${ticket.category?.name || 'Geral'}</p>
              <p><strong>Prioridade:</strong> ${priorityMap[ticket.priority] || ticket.priority}</p>
              <p><strong>Prazo de Atendimento:</strong> ${solutionHoursText}</p>
            </div>

            <p>Acesse o painel para assumir ou responder esta solicitação.</p>
          `,
        )
        const resStaff = await sendResendEmail(
          staffEmails,
          `[Novo Chamado #${ticket.id}] ${ticket.title}`,
          staffHtml,
        )
        results.push({ target: 'staff', res: resStaff })
      }
    }

    // --- TRIGGER 2 & REDIRECTION: Atribuição / Troca de Responsável / Redirecionamento ---
    if (event === 'assignment' || event === 'redirection') {
      const isRedirect = event === 'redirection'
      const redirectFrom = details?.redirect_from || details?.old_assignee_name || 'Anterior'
      const redirectTo = details?.redirect_to || details?.new_assignee_name || assigneeName

      // Notify Requester
      if (requesterEmail) {
        const reqSubject = isRedirect
          ? `[Chamado #${ticket.id}] Redirecionamento de Atendimento`
          : `[Chamado #${ticket.id}] Atribuição de Responsável Técnico`

        const reqContent = isRedirect
          ? `
            <h2>Chamado Redirecionado</h2>
            <p>Olá <strong>${requesterName}</strong>, o seu chamado <strong>#${ticket.id}</strong> foi redirecionado.</p>
            <div class="ticket-card">
              <p><strong>Título:</strong> ${ticket.title}</p>
              <p><strong>Anterior:</strong> ${redirectFrom}</p>
              <p><strong>Novo Responsável:</strong> ${redirectTo}</p>
            </div>
            <p>O novo atendente responsável dará continuidade ao seu chamado.</p>
          `
          : `
            <h2>Responsável Atribuído</h2>
            <p>Olá <strong>${requesterName}</strong>, o seu chamado <strong>#${ticket.id}</strong> agora possui um responsável técnico.</p>
            <div class="ticket-card">
              <p><strong>Título:</strong> ${ticket.title}</p>
              <p><strong>Responsável Técnico:</strong> ${redirectTo}</p>
            </div>
          `

        const resReq = await sendResendEmail(
          [requesterEmail],
          reqSubject,
          renderEmailTemplate(reqSubject, reqContent),
        )
        results.push({ target: 'requester', res: resReq })
      }

      // Notify new Assignee (if assigned and email exists)
      // Bypass: o e-mail de teste/revisão recebe mesmo sendo o autor da ação.
      if (assigneeEmail && (bypassEmail(assigneeEmail) || assigneeEmail !== actor_id)) {
        const assSubject = `[Atribuição #${ticket.id}] Você assumiu / foi atribuído ao chamado`
        const assContent = `
          <h2>Novo Chamado sob sua Responsabilidade</h2>
          <p>Olá <strong>${assigneeName}</strong>, você foi atribuído ao chamado <strong>#${ticket.id}</strong>.</p>
          <div class="ticket-card">
            <p><strong>Título:</strong> ${ticket.title}</p>
            <p><strong>Solicitante:</strong> ${requesterName}</p>
            <p><strong>Prioridade:</strong> ${priorityMap[ticket.priority] || ticket.priority}</p>
          </div>
        `

        const resAss = await sendResendEmail(
          [assigneeEmail],
          assSubject,
          renderEmailTemplate(assSubject, assContent),
        )
        results.push({ target: 'assignee', res: resAss })
      }
    }

    // --- TRIGGER 3 & 5: Atualização de Status / Encerramento ---
    if (event === 'status_change' || event === 'resolution') {
      const newStatus = details?.new_status || ticket.status
      const statusLabel = statusMap[newStatus] || newStatus

      if (requesterEmail) {
        const isResolution =
          newStatus === 'resolved' || newStatus === 'closed' || event === 'resolution'

        const subject = isResolution
          ? `[Chamado #${ticket.id}] Solução / Encerramento do Chamado`
          : `[Chamado #${ticket.id}] Atualização de Status: ${statusLabel}`

        const bodyContent = isResolution
          ? `
            <h2>Chamado Resolvido / Encerrado</h2>
            <p>Olá <strong>${requesterName}</strong>, o seu chamado <strong>#${ticket.id}</strong> foi marcado como <strong>${statusLabel}</strong>.</p>
            <div class="ticket-card">
              <p><strong>Título:</strong> ${ticket.title}</p>
              <p><strong>Status Atual:</strong> ${statusLabel}</p>
              <p><strong>Responsável:</strong> ${assigneeName}</p>
            </div>
            <p>Se a sua solicitação necessitar de mais apoio, você pode interagir diretamente pelo portal.</p>
          `
          : `
            <h2>Status Atualizado</h2>
            <p>Olá <strong>${requesterName}</strong>, houve uma alteração no status do seu chamado <strong>#${ticket.id}</strong>.</p>
            <div class="ticket-card">
              <p><strong>Título:</strong> ${ticket.title}</p>
              <p><strong>Novo Status:</strong> <strong>${statusLabel}</strong></p>
            </div>
          `

        const resReq = await sendResendEmail(
          [requesterEmail],
          subject,
          renderEmailTemplate(subject, bodyContent),
        )
        results.push({ target: 'requester', res: resReq })
      }
    }

    // --- TRIGGER 4: Notas / Comentários ---
    if (event === 'comment') {
      const isInternal = details?.is_internal || false
      const commentContent = details?.comment_content || ''

      // Internal comments are only for agents/admins and never notified to requester
      if (!isInternal) {
        // Find actor role or details
        let actorEmail = ''
        if (actor_id) {
          const { data: actor } = await supabase
            .from('profiles')
            .select('email, full_name, role')
            .eq('id', actor_id)
            .maybeSingle()
          if (actor) {
            actorEmail = actor.email
          }
        }

        // Target: if actor is requester, notify assignee or staff. If actor is staff/assignee, notify requester.
        const recipients: string[] = []

        if (actor_id === ticket.requester_id) {
          // Comment made by Requester -> notify Assignee or assigned agents
          if (assigneeEmail) {
            recipients.push(assigneeEmail)
          } else {
            // Notify staff if unassigned
            const { data: staffMembers } = await supabase
              .from('profiles')
              .select('email')
              .in('role', ['admin', 'agent'])
            ;(staffMembers || []).forEach((s) => {
              if (s.email && !recipients.includes(s.email)) recipients.push(s.email)
            })
          }
        } else {
          // Comment made by Staff / Agent -> notify Requester
          if (requesterEmail) {
            recipients.push(requesterEmail)
          }
        }

        // Bypass de auto-bloqueio: o e-mail de teste/revisão recebe mesmo sendo o autor da ação.
        const validRecipients = recipients.filter((e) => e && (bypassEmail(e) || e !== actorEmail))

        if (validRecipients.length > 0) {
          const subject = `[Nova Interação #${ticket.id}] ${ticket.title}`
          const bodyContent = `
            <h2>Nova Interação no Chamado #${ticket.id}</h2>
            <div class="ticket-card">
              <p><strong>Chamado:</strong> ${ticket.title}</p>
              <p><strong>Comentário:</strong></p>
              <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:4px; padding:12px; margin-top:8px;">
                ${commentContent}
              </div>
            </div>
            <p>Acesse a Central de Chamados para responder.</p>
          `

          const res = await sendResendEmail(
            validRecipients,
            subject,
            renderEmailTemplate(subject, bodyContent),
          )
          results.push({ target: 'comment_recipients', recipients: validRecipients, res })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Send notification error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
