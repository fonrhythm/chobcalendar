-- Apply ONLY after both website and released WeChat client use the gateway.
-- All full-feed overloads/legacy entry points must be closed together.
BEGIN;
DO $$ DECLARE f record; BEGIN
 IF to_regprocedure('public.chob_public_feed()') IS NULL THEN
  RAISE EXCEPTION 'Expected public.chob_public_feed() is missing';
 END IF;
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND
 (p.proname='chob_public_feed' OR p.proname LIKE 'chob\_public\_feed\_legacy%' ESCAPE '\') LOOP
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
 END LOOP;
 GRANT EXECUTE ON FUNCTION public.chob_public_feed() TO service_role;
END $$;
-- Preserve separate admin/editor policies; remove public bulk-table reads.
ALTER POLICY chob_events_public_read ON public.events USING (false);
ALTER POLICY chob_tasks_public_read ON public.tasks USING (false);
ALTER POLICY chob_artist_read ON public.artists USING
 (chob_private.can_edit_events() AND ((deleted_at IS NULL) OR chob_private.is_admin()));
ALTER POLICY chob_cp_read ON public.cp_pairs USING
 (chob_private.can_edit_events() AND ((deleted_at IS NULL) OR chob_private.is_admin()));
COMMIT;
-- Expected: false/false/true for the main feed, false/false for every legacy.
SELECT p.oid::regprocedure AS function,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anonymous,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS logged_in,
 has_function_privilege('service_role',p.oid,'EXECUTE') AS server
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname LIKE 'chob\_public\_feed%' ESCAPE '\';
