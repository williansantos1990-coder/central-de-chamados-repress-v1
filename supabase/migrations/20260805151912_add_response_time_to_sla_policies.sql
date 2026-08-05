-- Add response_time_hours column to sla_policies table
ALTER TABLE public.sla_policies
  ADD COLUMN IF NOT EXISTS response_time_hours NUMERIC DEFAULT 8;

-- Seed default market standard SLA policies for all existing categories
DO $$
DECLARE
  cat RECORD;
BEGIN
  FOR cat IN SELECT id FROM public.categories LOOP
    -- Prioridade Crítica (Resposta: 30 min / 0.5h, Solução: 4h)
    INSERT INTO public.sla_policies (category_id, priority, response_time_hours, duration_hours)
    VALUES (cat.id, 'critical', 0.5, 4)
    ON CONFLICT (category_id, priority)
    DO UPDATE SET
      response_time_hours = EXCLUDED.response_time_hours,
      duration_hours = EXCLUDED.duration_hours,
      updated_at = NOW();

    -- Prioridade Alta (Resposta: 1h, Solução: 8h)
    INSERT INTO public.sla_policies (category_id, priority, response_time_hours, duration_hours)
    VALUES (cat.id, 'high', 1, 8)
    ON CONFLICT (category_id, priority)
    DO UPDATE SET
      response_time_hours = EXCLUDED.response_time_hours,
      duration_hours = EXCLUDED.duration_hours,
      updated_at = NOW();

    -- Prioridade Média (Resposta: 4h, Solução: 24h)
    INSERT INTO public.sla_policies (category_id, priority, response_time_hours, duration_hours)
    VALUES (cat.id, 'medium', 4, 24)
    ON CONFLICT (category_id, priority)
    DO UPDATE SET
      response_time_hours = EXCLUDED.response_time_hours,
      duration_hours = EXCLUDED.duration_hours,
      updated_at = NOW();

    -- Prioridade Baixa (Resposta: 8h, Solução: 72h)
    INSERT INTO public.sla_policies (category_id, priority, response_time_hours, duration_hours)
    VALUES (cat.id, 'low', 8, 72)
    ON CONFLICT (category_id, priority)
    DO UPDATE SET
      response_time_hours = EXCLUDED.response_time_hours,
      duration_hours = EXCLUDED.duration_hours,
      updated_at = NOW();
  END LOOP;
END $$;
