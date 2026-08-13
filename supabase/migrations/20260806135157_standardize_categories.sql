-- Insert the 7 standardized sector categories (idempotent by name)
INSERT INTO public.categories (name)
SELECT name FROM (VALUES
  ('Diretoria'),
  ('Licitações'),
  ('Comercial'),
  ('Operações / Estoque'),
  ('Administrativo'),
  ('Tecnologia e Dados'),
  ('Filial')
) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.name = t.name
);

-- Reassign tickets from old categories to the closest new category
UPDATE public.tickets t
SET category_id = c_new.id
FROM public.categories c_old, public.categories c_new
WHERE t.category_id = c_old.id
  AND c_old.name NOT IN (
    'Diretoria', 'Licitações', 'Comercial', 'Operações / Estoque',
    'Administrativo', 'Tecnologia e Dados', 'Filial'
  )
  AND c_new.name = CASE
    WHEN c_old.name IN ('TI', 'Suporte') THEN 'Tecnologia e Dados'
    WHEN c_old.name IN ('Financeiro', 'RH', 'Outros') THEN 'Administrativo'
    WHEN c_old.name = 'Operações' THEN 'Operações / Estoque'
    ELSE 'Administrativo'
  END;

-- Insert SLA policies for new categories that don't have them yet
INSERT INTO public.sla_policies (category_id, priority, duration_hours)
SELECT c.id, p.priority::public.ticket_priority, p.duration_hours
FROM public.categories c
CROSS JOIN (VALUES
  ('low', 72),
  ('medium', 48),
  ('high', 24),
  ('critical', 4)
) AS p(priority, duration_hours)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sla_policies sp
  WHERE sp.category_id = c.id AND sp.priority = p.priority::public.ticket_priority
)
AND c.name IN (
  'Diretoria', 'Licitações', 'Comercial', 'Operações / Estoque',
  'Administrativo', 'Tecnologia e Dados', 'Filial'
);

-- Delete SLA policies for old categories (explicit, though CASCADE handles it)
DELETE FROM public.sla_policies
WHERE category_id NOT IN (
  SELECT id FROM public.categories
  WHERE name IN (
    'Diretoria', 'Licitações', 'Comercial', 'Operações / Estoque',
    'Administrativo', 'Tecnologia e Dados', 'Filial'
  )
);

-- Delete old categories not in the standardized list
DELETE FROM public.categories
WHERE name NOT IN (
  'Diretoria', 'Licitações', 'Comercial', 'Operações / Estoque',
  'Administrativo', 'Tecnologia e Dados', 'Filial'
);
