import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

interface AdminUser {
  id: string
  role: string
}

async function getCaller(supabase: any, token: string): Promise<AdminUser | null> {
  const { data: authData } = await supabase.auth.getUser(token)
  if (!authData?.user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', authData.user.id)
    .single()
  return profile as AdminUser | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  // URLs e chaves vindas das variáveis de ambiente (auto-configuradas pela Skip).
  const serviceUrl = (Deno.env.get('SUPABASE_URL') ||
    Deno.env.get('SUPABASE_URL_REF') ||
    Deno.env.get('SUPABASE_PROJECT_URL')) as string
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_SERVICE_KEY')) as string
  const publishableKey = (Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ||
    Deno.env.get('SUPABASE_ANON_KEY')) as string

  if (!serviceKey) {
    return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Cliente com o token do usuário, para validar o admin.
  const userClient = createClient(serviceUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const caller = await getCaller(userClient, token)
  if (!caller || caller.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const adminClient = createClient(serviceUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    // ===== CREATE USER =====
    if (req.method === 'POST' && action === 'create') {
      const body = await req.json()
      const { email, password, full_name, role, phone, sector } = body as {
        email: string
        password: string
        full_name: string
        role: string
        phone?: string | null
        sector?: string | null
      }

      if (!email || !password || !full_name || !role) {
        return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      if (!['admin', 'agent', 'requester'].includes(role)) {
        return new Response(JSON.stringify({ error: 'Perfil inválido.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'A senha deve ter ao menos 6 caracteres.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      })

      if (createError || !created?.user) {
        return new Response(
          JSON.stringify({ error: createError?.message || 'Erro ao criar usuário.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      const userId = created.user.id
      const { error: upsertError } = await adminClient.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name,
          role,
          phone: phone || null,
          sector: sector || null,
        },
        { onConflict: 'id' },
      )

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      return new Response(JSON.stringify({ id: userId }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // ===== DELETE USER =====
    if (req.method === 'POST' && action === 'delete') {
      const body = await req.json()
      const { userId } = body as { userId: string }

      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId obrigatório.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: 'Você não pode excluir a si mesmo.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // Primeiro exclui o perfil do usuário em public.profiles (e tabelas filhas via CASCADE/SET NULL)
      const { error: profileDelError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileDelError) {
        console.error('Erro ao excluir profile:', profileDelError)
        return new Response(
          JSON.stringify({ error: `Erro ao remover perfil: ${profileDelError.message}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      // Em seguida exclui o usuário do auth.users
      const { error: delError } = await adminClient.auth.admin.deleteUser(userId)
      if (delError) {
        console.error('Erro ao excluir usuário auth:', delError)
        return new Response(JSON.stringify({ error: delError.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ error: 'Operação não suportada.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Erro interno.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
