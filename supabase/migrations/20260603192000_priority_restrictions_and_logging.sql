-- Create trigger function to log priority changes
CREATE OR REPLACE FUNCTION public.log_priority_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    IF auth.uid() IS NOT NULL THEN
      INSERT INTO public.activity_log (ticket_id, user_id, action_type, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'priority_change', OLD.priority::text, NEW.priority::text);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to prevent requester from changing priority
CREATE OR REPLACE FUNCTION public.restrict_priority_update()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
      IF user_role = 'requester' THEN
        RAISE EXCEPTION 'Apenas agentes ou administradores podem alterar a prioridade do chamado.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_priority_change ON public.tickets;
CREATE TRIGGER on_ticket_priority_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_priority_change();

DROP TRIGGER IF EXISTS on_ticket_priority_update_restrict ON public.tickets;
CREATE TRIGGER on_ticket_priority_update_restrict
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_priority_update();
