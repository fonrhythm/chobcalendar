-- Emergency rollback restores the original public access AND scraping exposure.
BEGIN;
GRANT EXECUTE ON FUNCTION public.chob_public_feed() TO anon,authenticated;
ALTER POLICY chob_events_public_read ON public.events USING
 (status='published' AND cancelled_at IS NULL AND (scheduled_publish_at IS NULL OR scheduled_publish_at<=now()));
ALTER POLICY chob_tasks_public_read ON public.tasks USING
 (status='published' AND EXISTS (SELECT 1 FROM public.events e WHERE e.id=tasks.event_id AND e.status='published' AND e.cancelled_at IS NULL AND (e.scheduled_publish_at IS NULL OR e.scheduled_publish_at<=now())));
ALTER POLICY chob_artist_read ON public.artists USING
 (chob_private.active_member() AND ((deleted_at IS NULL) OR chob_private.is_admin()));
ALTER POLICY chob_cp_read ON public.cp_pairs USING
 (chob_private.active_member() AND ((deleted_at IS NULL) OR chob_private.is_admin()));
COMMIT;
