-- Recalculate goal progress when a contribution is inserted, edited, or removed.
CREATE OR REPLACE FUNCTION private.finora_adjust_goal_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_user_id bigint;
BEGIN
  v_user_id := private.current_legacy_user_id();

  IF TG_OP <> 'INSERT' THEN
    UPDATE public.metas_ahorro
    SET monto_actual = GREATEST(0, monto_actual - OLD.monto)
    WHERE id = OLD.meta_id AND usuario_id = v_user_id;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    UPDATE public.metas_ahorro
    SET monto_actual = monto_actual + NEW.monto,
        estado = CASE
          WHEN monto_actual + NEW.monto >= monto_objetivo THEN 'completada'
          WHEN estado = 'completada' THEN 'activa'
          ELSE estado
        END
    WHERE id = NEW.meta_id AND usuario_id = v_user_id;
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION private.finora_adjust_goal_progress() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS finora_adjust_goal_progress_on_contribution ON public.aportaciones_ahorro;
CREATE TRIGGER finora_adjust_goal_progress_on_contribution
  AFTER INSERT OR UPDATE OR DELETE ON public.aportaciones_ahorro
  FOR EACH ROW EXECUTE FUNCTION private.finora_adjust_goal_progress();
