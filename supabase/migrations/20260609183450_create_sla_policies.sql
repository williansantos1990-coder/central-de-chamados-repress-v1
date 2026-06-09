DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    priority public.ticket_priority NOT NULL,
    duration_hours INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, priority)
  );
END $$;

DROP TRIGGER IF EXISTS set_sla_updated_at ON public.sla_policies;
CREATE TRIGGER set_sla_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SLA policies viewable by everyone" ON public.sla_policies;
CREATE POLICY "SLA policies viewable by everyone" ON public.sla_policies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert SLA policies" ON public.sla_policies;
CREATE POLICY "Admins can insert SLA policies" ON public.sla_policies
  FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::public.user_role ));

DROP POLICY IF EXISTS "Admins can update SLA policies" ON public.sla_policies;
CREATE POLICY "Admins can update SLA policies" ON public.sla_policies
  FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::public.user_role ));

DROP POLICY IF EXISTS "Admins can delete SLA policies" ON public.sla_policies;
CREATE POLICY "Admins can delete SLA policies" ON public.sla_policies
  FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::public.user_role ));

DO $$
DECLARE
  cat_id UUID;
BEGIN
  INSERT INTO public.categories (id, name) VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Suporte') ON CONFLICT (id) DO NOTHING;
  
  FOR cat_id IN SELECT id FROM public.categories LOOP
    INSERT INTO public.sla_policies (category_id, priority, duration_hours) VALUES
      (cat_id, 'low', 72),
      (cat_id, 'medium', 48),
      (cat_id, 'high', 24),
      (cat_id, 'critical', 4)
    ON CONFLICT (category_id, priority) DO NOTHING;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_ticket_deadline()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  sla_hours INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT duration_hours INTO sla_hours FROM public.sla_policies 
    WHERE category_id = NEW.category_id AND priority = NEW.priority;
  ELSIF OLD.category_id IS DISTINCT FROM NEW.category_id OR OLD.priority IS DISTINCT FROM NEW.priority THEN
    SELECT duration_hours INTO sla_hours FROM public.sla_policies 
    WHERE category_id = NEW.category_id AND priority = NEW.priority;
  END IF;
  
  IF sla_hours IS NOT NULL THEN
    NEW.deadline := NEW.created_at + (sla_hours || ' hours')::interval;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_ticket_sla_calculate ON public.tickets;
CREATE TRIGGER on_ticket_sla_calculate
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.calculate_ticket_deadline();
