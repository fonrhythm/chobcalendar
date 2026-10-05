-- Apply after existing Admin migrations 001–031. Additive and transactional.
BEGIN;
CREATE TABLE IF NOT EXISTS chob_private.wechat_identities (
 app_id text NOT NULL, open_id text NOT NULL, user_id uuid NOT NULL REFERENCES auth.users(id),
 PRIMARY KEY(app_id,open_id), UNIQUE(app_id,user_id)
);
REVOKE ALL ON chob_private.wechat_identities FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.chob_wechat_identity(app_id text,open_id text,linked_user uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result uuid;
BEGIN
 IF linked_user IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=linked_user AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Invalid verified identity'; END IF;
  INSERT INTO chob_private.wechat_identities VALUES(app_id,open_id,linked_user) ON CONFLICT DO NOTHING;
 END IF;
 SELECT w.user_id INTO result FROM chob_private.wechat_identities w WHERE w.app_id=chob_wechat_identity.app_id AND w.open_id=chob_wechat_identity.open_id;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.chob_wechat_identity(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chob_wechat_identity(text,text,uuid) TO service_role;

CREATE TABLE IF NOT EXISTS public.chob_submission_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.users(id),
 event_id uuid NOT NULL UNIQUE REFERENCES public.events(id), payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 reply text NOT NULL DEFAULT '', resolved_by uuid REFERENCES public.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
ALTER TABLE public.chob_submission_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chob_submission_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.chob_submission_reviews TO authenticated;
DROP POLICY IF EXISTS chob_submission_review_read ON public.chob_submission_reviews;
CREATE POLICY chob_submission_review_read ON public.chob_submission_reviews FOR SELECT TO authenticated USING(user_id=auth.uid() OR chob_private.is_admin());

-- Reuse the deployed validations, artist handling and task transaction without
-- giving WeChat identities access to the Web's direct-publish entry point.
DO $patch$
DECLARE original text; copied text;
BEGIN
 IF to_regprocedure('chob_private.mini_submit_base(jsonb,uuid,text)') IS NULL THEN
  SELECT pg_get_functiondef('public.chob_submit_event(jsonb,uuid,text)'::regprocedure) INTO original;
  copied:=replace(original,'public.chob_submit_event(', 'chob_private.mini_submit_base(');
  IF copied=original THEN RAISE EXCEPTION 'Submission function mismatch'; END IF;
  EXECUTE copied;
 END IF;
 SELECT pg_get_functiondef('public.chob_submit_event(jsonb,uuid,text)'::regprocedure) INTO original;
 IF strpos(original,'wechat_identities')=0 THEN
  copied:=replace(original,'BEGIN', 'BEGIN
 IF EXISTS(SELECT 1 FROM chob_private.wechat_identities WHERE user_id=auth.uid()) THEN RAISE EXCEPTION ''微信投稿须经审核'' USING ERRCODE=''42501''; END IF;');
  IF copied=original THEN RAISE EXCEPTION 'Submission guard mismatch'; END IF;
  EXECUTE copied;
 END IF;
 SELECT pg_get_functiondef('public.chob_submit_event_scheduled(jsonb,uuid,text)'::regprocedure) INTO original;
 copied:=replace(replace(original,'public.chob_submit_event_scheduled(', 'chob_private.mini_submit_scheduled('),'public.chob_submit_event(', 'chob_private.mini_submit_base(');
 EXECUTE copied;
 SELECT pg_get_functiondef('public.chob_submit_event_with_tasks(jsonb,jsonb,uuid,text)'::regprocedure) INTO original;
 copied:=replace(replace(original,'public.chob_submit_event_with_tasks(', 'chob_private.mini_submit_tasks('),'public.chob_submit_event_scheduled(', 'chob_private.mini_submit_scheduled(');
 EXECUTE copied;
END $patch$;
REVOKE ALL ON FUNCTION chob_private.mini_submit_base(jsonb,uuid,text),chob_private.mini_submit_scheduled(jsonb,uuid,text),chob_private.mini_submit_tasks(jsonb,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.chob_mini_submit(payload jsonb,task_payload jsonb DEFAULT '[]')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE event uuid; result uuid;
BEGIN
 IF NOT chob_private.active_member() THEN RAISE EXCEPTION '请先登录' USING ERRCODE='42501'; END IF;
 IF length(payload::text)>30000 THEN RAISE EXCEPTION '投稿过长'; END IF;
 IF (SELECT count(*) FROM public.chob_submission_reviews WHERE user_id=auth.uid() AND created_at>now()-interval '1 day')>=20 THEN RAISE EXCEPTION '每日最多20份投稿'; END IF;
 event:=chob_private.mini_submit_tasks(payload-'scheduled_publish_at',task_payload,NULL,NULL);
 -- Not visible to public feed at any point: all writes commit together.
 UPDATE public.events SET status='draft' WHERE id=event;
 UPDATE public.tasks SET status='draft' WHERE event_id=event;
 INSERT INTO public.chob_submission_reviews(user_id,event_id,payload) VALUES(auth.uid(),event,payload||jsonb_build_object('task_payload',task_payload)) RETURNING id INTO result;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.chob_mini_submissions() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC),'[]'::jsonb) FROM public.chob_submission_reviews r WHERE r.user_id=auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.chob_review_submission(target uuid,decision text,response text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.chob_submission_reviews;
BEGIN
 PERFORM chob_private.require_admin();
 IF decision IS NULL OR decision NOT IN ('approved','rejected') OR length(response)>4000 THEN RAISE EXCEPTION '审核结果无效'; END IF;
 SELECT * INTO item FROM public.chob_submission_reviews WHERE id=target FOR UPDATE;
 IF NOT FOUND OR item.status<>'pending' THEN RAISE EXCEPTION '投稿已处理或不存在'; END IF;
 PERFORM 1 FROM public.events WHERE id=item.event_id AND status='draft' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION '活动状态已改变，请先核对'; END IF;
 IF decision='approved' THEN
  UPDATE public.events SET status='published',updated_at=clock_timestamp() AT TIME ZONE 'UTC' WHERE id=item.event_id;
  UPDATE public.tasks SET status='published',updated_at=clock_timestamp() AT TIME ZONE 'UTC' WHERE event_id=item.event_id;
 END IF;
 UPDATE public.chob_submission_reviews SET status=decision,reply=response,resolved_by=auth.uid(),resolved_at=now() WHERE id=target;
 INSERT INTO public.chob_messages(user_id,event_id,content) VALUES(item.user_id,item.event_id,CASE WHEN decision='approved' THEN '投稿已通过' ELSE '投稿已拒绝' END||'：'||response);
END $$;
CREATE OR REPLACE FUNCTION public.chob_mini_toggle_favorite(target text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE existing text[]; saved boolean;
BEGIN
 IF NOT chob_private.active_member() THEN RAISE EXCEPTION '请先登录' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE 'supabase:'||id::text=target AND status='published') THEN RAISE EXCEPTION '活动不存在'; END IF;
 INSERT INTO public.chob_personal(id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT favorites INTO existing FROM public.chob_personal WHERE id=auth.uid() FOR UPDATE;
 saved:=NOT(target=ANY(existing));
 UPDATE public.chob_personal SET favorites=CASE WHEN saved THEN array_append(existing,target) ELSE array_remove(existing,target) END,updated_at=now() WHERE id=auth.uid();
 RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.chob_mini_submit(jsonb,jsonb),public.chob_mini_submissions(),public.chob_review_submission(uuid,text,text),public.chob_mini_toggle_favorite(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chob_mini_submit(jsonb,jsonb),public.chob_mini_submissions(),public.chob_review_submission(uuid,text,text),public.chob_mini_toggle_favorite(text) TO authenticated;
INSERT INTO chob_private.migrations(version) VALUES('032') ON CONFLICT DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;
