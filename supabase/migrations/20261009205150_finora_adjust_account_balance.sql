-- Keep account balances consistent with the transaction ledger.
CREATE OR REPLACE FUNCTION private.finora_adjust_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_old_delta numeric := 0;
  v_new_delta numeric := 0;
  v_user_id bigint;
BEGIN
  v_user_id := private.current_legacy_user_id();

  IF TG_OP <> 'INSERT' THEN
    v_old_delta := CASE WHEN OLD.tipo = 'ingreso' THEN OLD.monto ELSE -OLD.monto END;
    UPDATE public.cuentas
    SET saldo_actual = saldo_actual - v_old_delta
    WHERE id = OLD.cuenta_id AND usuario_id = v_user_id;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    v_new_delta := CASE WHEN NEW.tipo = 'ingreso' THEN NEW.monto ELSE -NEW.monto END;
    UPDATE public.cuentas
    SET saldo_actual = saldo_actual + v_new_delta
    WHERE id = NEW.cuenta_id AND usuario_id = v_user_id;
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$function$;

REVOKE ALL ON FUNCTION private.finora_adjust_account_balance() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS finora_adjust_balance_on_transaction ON public.transacciones;
CREATE TRIGGER finora_adjust_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION private.finora_adjust_account_balance();
