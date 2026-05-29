DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('requester', 'agent', 'admin');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
    CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE public.ticket_status AS ENUM ('open', 'analyzing', 'waiting_requester', 'in_service', 'resolved', 'closed', 'canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'requester',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  priority public.ticket_priority NOT NULL DEFAULT 'low',
  status public.ticket_status NOT NULL DEFAULT 'open',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Tickets viewable by requester, agents and admins" ON public.tickets;
CREATE POLICY "Tickets viewable by requester, agents and admins" ON public.tickets FOR SELECT TO authenticated USING (
  requester_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

DROP POLICY IF EXISTS "Tickets insertable by everyone" ON public.tickets;
CREATE POLICY "Tickets insertable by everyone" ON public.tickets FOR INSERT TO authenticated WITH CHECK (
  requester_id = auth.uid()
);

DROP POLICY IF EXISTS "Tickets updatable by assignee, agents and admins" ON public.tickets;
CREATE POLICY "Tickets updatable by assignee, agents and admins" ON public.tickets FOR UPDATE TO authenticated USING (
  requester_id = auth.uid() OR
  assignee_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

DROP POLICY IF EXISTS "Comments viewable depending on internal flag" ON public.comments;
CREATE POLICY "Comments viewable depending on internal flag" ON public.comments FOR SELECT TO authenticated USING (
  (NOT is_internal AND EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_id AND tickets.requester_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

DROP POLICY IF EXISTS "Comments insertable by ticket viewers" ON public.comments;
CREATE POLICY "Comments insertable by ticket viewers" ON public.comments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_id AND (tickets.requester_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))))
);

DROP POLICY IF EXISTS "Activity logs viewable by agents and admins" ON public.activity_log;
CREATE POLICY "Activity logs viewable by agents and admins" ON public.activity_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

DROP POLICY IF EXISTS "Activity logs insertable by everyone" ON public.activity_log;
CREATE POLICY "Activity logs insertable by everyone" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.tickets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'requester')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.categories (id, name) VALUES 
('c1111111-1111-1111-1111-111111111111', 'TI'),
('c2222222-2222-2222-2222-222222222222', 'Financeiro'),
('c3333333-3333-3333-3333-333333333333', 'RH'),
('c4444444-4444-4444-4444-444444444444', 'Operações'),
('c5555555-5555-5555-5555-555555555555', 'Comercial'),
('c6666666-6666-6666-6666-666666666666', 'Outros')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  new_user_id uuid;
  agent_id uuid;
  requester_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gil.araujo@repress.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'gil.araujo@repress.com.br', crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Gil Araujo"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.profiles (id, full_name, email, role) VALUES (new_user_id, 'Gil Araujo', 'gil.araujo@repress.com.br', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agente@repress.com.br') THEN
    agent_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (agent_id, '00000000-0000-0000-0000-000000000000', 'agente@repress.com.br', crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Agente Teste"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');

    INSERT INTO public.profiles (id, full_name, email, role) VALUES (agent_id, 'Agente Teste', 'agente@repress.com.br', 'agent') ON CONFLICT (id) DO UPDATE SET role = 'agent';
  ELSE
    SELECT id INTO agent_id FROM auth.users WHERE email = 'agente@repress.com.br';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'solicitante@repress.com.br') THEN
    requester_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (requester_id, '00000000-0000-0000-0000-000000000000', 'solicitante@repress.com.br', crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Solicitante Teste"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');

    INSERT INTO public.profiles (id, full_name, email, role) VALUES (requester_id, 'Solicitante Teste', 'solicitante@repress.com.br', 'requester') ON CONFLICT (id) DO NOTHING;
  ELSE
    SELECT id INTO requester_id FROM auth.users WHERE email = 'solicitante@repress.com.br';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tickets LIMIT 1) THEN
    INSERT INTO public.tickets (title, description, requester_id, assignee_id, category_id, priority, status) VALUES
    ('Internet lenta na recepção', 'A conexão cai a cada 10 min', requester_id, NULL, 'c1111111-1111-1111-1111-111111111111', 'medium', 'open'),
    ('Problema de Pagamento', 'Erro ao processar boleto', requester_id, agent_id, 'c2222222-2222-2222-2222-222222222222', 'high', 'in_service'),
    ('Solicitação de Férias', 'Gostaria de agendar para Janeiro', requester_id, NULL, 'c3333333-3333-3333-3333-333333333333', 'low', 'open'),
    ('Sistema Fora do Ar', 'Ninguém consegue logar no ERP', requester_id, agent_id, 'c1111111-1111-1111-1111-111111111111', 'critical', 'analyzing');
  END IF;
END $$;
