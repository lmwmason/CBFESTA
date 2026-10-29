-- A retained database volume may contain auth objects owned by postgres.
-- GoTrue runs migrations as supabase_auth_admin, so restore ownership first.
DO
$$
DECLARE
  object_record record;
  object_kind text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    RETURN;
  END IF;

  ALTER SCHEMA auth OWNER TO supabase_auth_admin;

  FOR object_record IN
    SELECT c.relkind, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
  LOOP
    object_kind := CASE object_record.relkind
      WHEN 'S' THEN 'SEQUENCE'
      WHEN 'v' THEN 'VIEW'
      WHEN 'm' THEN 'MATERIALIZED VIEW'
      WHEN 'f' THEN 'FOREIGN TABLE'
      ELSE 'TABLE'
    END;
    EXECUTE format(
      'ALTER %s %I.%I OWNER TO supabase_auth_admin',
      object_kind,
      'auth',
      object_record.relname
    );
  END LOOP;

  FOR object_record IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.prokind IN ('f', 'p')
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) OWNER TO supabase_auth_admin',
      'auth',
      object_record.proname,
      object_record.arguments
    );
  END LOOP;
END
$$;
