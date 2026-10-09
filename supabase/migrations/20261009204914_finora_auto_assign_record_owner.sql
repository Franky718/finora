-- Never trust a client-supplied numeric owner ID: derive it from Supabase Auth.
CREATE OR REPLACE FUNCTION private.finora_set_legacy_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_user_id bigint;
BEGIN
  v_user_id := private.current_legacy_user_id();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'An active authenticated Finora user is required.'
      USING ERRCODE = '42501';
  END IF;

  NEW.usuario_id := v_user_id;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.finora_set_legacy_owner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS finora_owner_cuentas ON public.cuentas;
CREATE TRIGGER finora_owner_cuentas
  BEFORE INSERT OR UPDATE ON public.cuentas
  FOR EACH ROW EXECUTE FUNCTION private.finora_set_legacy_owner();

DROP TRIGGER IF EXISTS finora_owner_metas_ahorro ON public.metas_ahorro;
CREATE TRIGGER finora_owner_metas_ahorro
  BEFORE INSERT OR UPDATE ON public.metas_ahorro
  FOR EACH ROW EXECUTE FUNCTION private.finora_set_legacy_owner();

DROP TRIGGER IF EXISTS finora_owner_transacciones ON public.transacciones;
CREATE TRIGGER finora_owner_transacciones
  BEFORE INSERT OR UPDATE ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION private.finora_set_legacy_owner();

DROP TRIGGER IF EXISTS finora_owner_aportaciones_ahorro ON public.aportaciones_ahorro;
CREATE TRIGGER finora_owner_aportaciones_ahorro
  BEFORE INSERT OR UPDATE ON public.aportaciones_ahorro
  FOR EACH ROW EXECUTE FUNCTION private.finora_set_legacy_owner();

DROP TRIGGER IF EXISTS finora_owner_categorias ON public.categorias;
CREATE TRIGGER finora_owner_categorias
  BEFORE INSERT OR UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION private.finora_set_legacy_owner();
