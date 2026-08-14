CREATE OR REPLACE FUNCTION public.handle_ticket_assignment_timeline()
RETURNS trigger AS $$
DECLARE
  old_name text := 'Não atribuído';
  new_name text := 'Não atribuído';
BEGIN
  -- Only execute if responsible_id / assignee_id changed
  IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    -- Get old assignee name if existed
    IF OLD.assignee_id IS NOT NULL THEN
      SELECT COALESCE(full_name, email) INTO old_name
      FROM public.profiles
      WHERE id = OLD.assignee_id;
    END IF;

    -- Get new assignee name if exists
    IF NEW.assignee_id IS NOT NULL THEN
      SELECT COALESCE(full_name, email) INTO new_name
      FROM public.profiles
      WHERE id = NEW.assignee_id;
    END IF;

    -- Insert activity log entry for redirection / assignment timeline
    INSERT INTO public.activity_log (
      ticket_id,
      user_id,
      action_type,
      old_value,
      new_value
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), OLD.requester_id),
      'redirection',
      old_name,
      'Chamado redirecionado de ' || old_name || ' para ' || new_name
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger on tickets table
DROP TRIGGER IF EXISTS tr_ticket_assignment_timeline ON public.tickets;
CREATE TRIGGER tr_ticket_assignment_timeline
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_ticket_assignment_timeline();
