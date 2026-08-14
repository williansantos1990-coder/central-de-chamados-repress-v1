-- Módulo de Usuários: adiciona telefone/setor, RLS para admins gerenciarem usuários.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector text;

-- Função auxiliar: retorna true se o usuário autenticado atual é admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
  );
$$;

-- ===== RLS policies para profiles =====
-- SELECT já existe ("Profiles are viewable by everyone"); mantida.

-- Admins podem inserir novos perfis (criados junto à edge function de criação de usuários).
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Admins podem atualizar qualquer perfil (já existe "Admins can update any profile" e
-- "Users can update own profile"). Recriamos a de admin para garantir o novo escopo.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins podem excluir perfis (nova política).
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin());
