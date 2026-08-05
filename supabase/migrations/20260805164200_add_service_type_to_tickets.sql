ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'suporte_tecnico';
