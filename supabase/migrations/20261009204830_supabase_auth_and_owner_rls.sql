-- Connect Supabase Auth identities to Finora's legacy bigint user IDs.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_auth_user_id_fkey'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_user_id_uidx
  ON public.usuarios(auth_user_id);

-- New users authenticate with Supabase Auth instead of a custom password hash.
ALTER TABLE public.usuarios ALTER COLUMN password_hash DROP NOT NULL;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.current_legacy_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT u.id
  FROM public.usuarios AS u
  WHERE u.auth_user_id = (SELECT auth.uid())
    AND u.estado IS TRUE
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION private.current_legacy_user_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.current_legacy_user_id() TO authenticated;

CREATE OR REPLACE FUNCTION private.finora_handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_full_name text := btrim(coalesce(NEW.raw_user_meta_data ->> 'full_name', ''));
  v_first_name text;
  v_last_name text;
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'Finora currently requires email-based authentication.';
  END IF;

  v_first_name := coalesce(
    nullif(btrim(NEW.raw_user_meta_data ->> 'nombre'), ''),
    nullif(split_part(v_full_name, ' ', 1), ''),
    'Usuario'
  );

  v_last_name := coalesce(
    nullif(btrim(NEW.raw_user_meta_data ->> 'apellido'), ''),
    nullif(btrim(substr(v_full_name, length(split_part(v_full_name, ' ', 1)) + 1)), ''),
    ''
  );

  INSERT INTO public.usuarios
    (nombre, apellido, email, password_hash, rol, estado, auth_user_id)
  VALUES
    (v_first_name, v_last_name, lower(NEW.email), NULL, 'usuario', TRUE, NEW.id);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.finora_handle_auth_user_created() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS finora_sync_auth_user_to_usuarios ON auth.users;
CREATE TRIGGER finora_sync_auth_user_to_usuarios
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.finora_handle_auth_user_created();

-- Do not expose the legacy user/password or custom-session tables to clients.
REVOKE ALL ON TABLE public.usuarios FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.sesiones FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS usuarios_no_direct_client_access ON public.usuarios;
CREATE POLICY usuarios_no_direct_client_access
  ON public.usuarios FOR ALL TO anon, authenticated
  USING (FALSE) WITH CHECK (FALSE);

DROP POLICY IF EXISTS sesiones_no_direct_client_access ON public.sesiones;
CREATE POLICY sesiones_no_direct_client_access
  ON public.sesiones FOR ALL TO anon, authenticated
  USING (FALSE) WITH CHECK (FALSE);

REVOKE ALL ON TABLE public.cuentas, public.categorias, public.transacciones,
  public.metas_ahorro, public.aportaciones_ahorro, public.logs_actividad
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.cuentas, public.categorias, public.transacciones,
    public.metas_ahorro, public.aportaciones_ahorro
  TO authenticated;
GRANT SELECT ON TABLE public.logs_actividad TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

DROP POLICY IF EXISTS cuentas_owner_access ON public.cuentas;
CREATE POLICY cuentas_owner_access
  ON public.cuentas FOR ALL TO authenticated
  USING (usuario_id = (SELECT private.current_legacy_user_id()))
  WITH CHECK (usuario_id = (SELECT private.current_legacy_user_id()));

DROP POLICY IF EXISTS metas_ahorro_owner_access ON public.metas_ahorro;
CREATE POLICY metas_ahorro_owner_access
  ON public.metas_ahorro FOR ALL TO authenticated
  USING (usuario_id = (SELECT private.current_legacy_user_id()))
  WITH CHECK (usuario_id = (SELECT private.current_legacy_user_id()));

DROP POLICY IF EXISTS transacciones_owner_access ON public.transacciones;
CREATE POLICY transacciones_owner_access
  ON public.transacciones FOR ALL TO authenticated
  USING (usuario_id = (SELECT private.current_legacy_user_id()))
  WITH CHECK (
    usuario_id = (SELECT private.current_legacy_user_id())
    AND EXISTS (
      SELECT 1 FROM public.cuentas AS c
      WHERE c.id = cuenta_id AND c.usuario_id = (SELECT private.current_legacy_user_id())
    )
    AND EXISTS (
      SELECT 1 FROM public.categorias AS cat
      WHERE cat.id = categoria_id
        AND (cat.usuario_id IS NULL OR cat.usuario_id = (SELECT private.current_legacy_user_id()))
    )
  );

DROP POLICY IF EXISTS aportaciones_ahorro_owner_access ON public.aportaciones_ahorro;
CREATE POLICY aportaciones_ahorro_owner_access
  ON public.aportaciones_ahorro FOR ALL TO authenticated
  USING (usuario_id = (SELECT private.current_legacy_user_id()))
  WITH CHECK (
    usuario_id = (SELECT private.current_legacy_user_id())
    AND EXISTS (
      SELECT 1 FROM public.metas_ahorro AS m
      WHERE m.id = meta_id AND m.usuario_id = (SELECT private.current_legacy_user_id())
    )
  );

DROP POLICY IF EXISTS categorias_read_global_or_owner ON public.categorias;
CREATE POLICY categorias_read_global_or_owner
  ON public.categorias FOR SELECT TO authenticated
  USING (usuario_id IS NULL OR usuario_id = (SELECT private.current_legacy_user_id()));

DROP POLICY IF EXISTS categorias_modify_owner_only ON public.categorias;
CREATE POLICY categorias_modify_owner_only
  ON public.categorias FOR ALL TO authenticated
  USING (usuario_id = (SELECT private.current_legacy_user_id()))
  WITH CHECK (usuario_id = (SELECT private.current_legacy_user_id()));

DROP POLICY IF EXISTS logs_actividad_read_own ON public.logs_actividad;
CREATE POLICY logs_actividad_read_own
  ON public.logs_actividad FOR SELECT TO authenticated
  USING (usuario_id = (SELECT private.current_legacy_user_id()));

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_ahorro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aportaciones_ahorro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_actividad ENABLE ROW LEVEL SECURITY;
