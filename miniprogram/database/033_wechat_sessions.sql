-- Apply after 032; preserve user UUIDs, roles and all existing personal data.
BEGIN;
CREATE TABLE IF NOT EXISTS chob_private.wechat_sessions (
 session_id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id),
 app_id text NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
-- Keep classification after Auth deletes a session: its old JWT must never become a Web session.
CREATE TABLE IF NOT EXISTS chob_private.wechat_link_codes (
 digest bytea PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id),
 session_id uuid NOT NULL,expires_at timestamptz NOT NULL,used_at timestamptz
);
CREATE TABLE IF NOT EXISTS chob_private.wechat_write_permits (
 session_id uuid NOT NULL, transaction_id bigint NOT NULL,PRIMARY KEY(session_id,transaction_id)
);
REVOKE ALL ON chob_private.wechat_sessions,chob_private.wechat_link_codes,chob_private.wechat_write_permits FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION chob_private.is_wechat_session() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM chob_private.wechat_sessions WHERE session_id=nullif(auth.jwt()->>'session_id','')::uuid);
$$;
CREATE OR REPLACE FUNCTION chob_private.wechat_session_active() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT chob_private.is_wechat_session() OR EXISTS(
 SELECT 1 FROM chob_private.wechat_sessions w JOIN auth.sessions s ON s.id=w.session_id AND s.user_id=w.user_id
 WHERE w.session_id=nullif(auth.jwt()->>'session_id','')::uuid AND w.user_id=auth.uid() AND w.revoked_at IS NULL);
$$;
REVOKE ALL ON FUNCTION chob_private.is_wechat_session(),chob_private.wechat_session_active() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION chob_private.is_wechat_session(),chob_private.wechat_session_active() TO authenticated;
-- Previously issued synthetic WeChat accounts have no original Web account to classify.
INSERT INTO chob_private.wechat_sessions(session_id,user_id,app_id)
 SELECT s.id,s.user_id,w.app_id FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id
 JOIN chob_private.wechat_identities w ON w.user_id=u.id
 WHERE u.email ~ '^wx-[0-9a-f]{64}@wechat\.chob\.invalid$' ON CONFLICT DO NOTHING;
DO $patch$
DECLARE original text; revised text; name text;
BEGIN
 SELECT pg_get_functiondef('public.chob_submit_event(jsonb,uuid,text)'::regprocedure) INTO original;
 revised:=replace(original,'EXISTS(SELECT 1 FROM chob_private.wechat_identities WHERE user_id=auth.uid())','chob_private.is_wechat_session()');
 IF revised=original AND strpos(original,'is_wechat_session')=0 THEN RAISE EXCEPTION '032 submission guard missing'; END IF;
 EXECUTE revised;
 -- Preserve actual deployed permission logic; add only session constraints.
 FOREACH name IN ARRAY ARRAY['active_member','is_admin','can_edit_events','can_review_users'] LOOP
  IF to_regprocedure('chob_private.web_'||name||'()') IS NULL THEN
   SELECT pg_get_functiondef(to_regprocedure('chob_private.'||name||'()')) INTO original;
   IF original IS NULL THEN RAISE EXCEPTION 'Missing permission function %',name; END IF;
   EXECUTE replace(original,'chob_private.'||name||'(', 'chob_private.web_'||name||'(');
  END IF;
  EXECUTE format('CREATE OR REPLACE FUNCTION chob_private.%I() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='''' AS %L',name,
   'SELECT chob_private.web_'||name||'() AND '||CASE WHEN name='active_member' THEN 'chob_private.wechat_session_active()' ELSE 'NOT chob_private.is_wechat_session()' END);
  EXECUTE format('REVOKE ALL ON FUNCTION chob_private.web_%I() FROM PUBLIC,anon,authenticated',name);
 END LOOP;
 SELECT pg_get_functiondef('public.chob_mini_submit(jsonb,jsonb)'::regprocedure) INTO original;
 IF strpos(original,'wechat_write_permits')=0 THEN
  revised:=replace(original,'event:=chob_private.mini_submit_tasks',
   'INSERT INTO chob_private.wechat_write_permits VALUES(nullif(auth.jwt()->>''session_id'','''')::uuid,txid_current());
 event:=chob_private.mini_submit_tasks');
  -- Web callers may still use the review entry point; no permit needed for those sessions.
  revised:=replace(revised,'INSERT INTO chob_private.wechat_write_permits VALUES', 'IF chob_private.is_wechat_session() THEN INSERT INTO chob_private.wechat_write_permits VALUES');
  revised:=replace(revised,'::uuid,txid_current());', '::uuid,txid_current()); END IF;');
  revised:=replace(revised,'RETURN result;', 'DELETE FROM chob_private.wechat_write_permits WHERE session_id=nullif(auth.jwt()->>''session_id'','''')::uuid AND transaction_id=txid_current(); RETURN result;');
  IF revised=original THEN RAISE EXCEPTION 'Mini submit mismatch'; END IF;
  EXECUTE revised;
 END IF;
END $patch$;
CREATE OR REPLACE FUNCTION chob_private.guard_wechat_event_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF chob_private.is_wechat_session() AND NOT EXISTS(SELECT 1 FROM chob_private.wechat_write_permits
 WHERE session_id=nullif(auth.jwt()->>'session_id','')::uuid AND transaction_id=txid_current()) THEN
  RAISE EXCEPTION '微信活动修改须经审核' USING ERRCODE='42501';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION chob_private.guard_wechat_event_write() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS chob_wechat_write_guard ON public.events;
CREATE TRIGGER chob_wechat_write_guard BEFORE INSERT OR UPDATE OR DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION chob_private.guard_wechat_event_write();
DROP TRIGGER IF EXISTS chob_wechat_write_guard ON public.tasks;
CREATE TRIGGER chob_wechat_write_guard BEFORE INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION chob_private.guard_wechat_event_write();
CREATE OR REPLACE FUNCTION public.chob_wechat_link_code() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE code text; sid uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
BEGIN
 IF NOT chob_private.active_member() OR chob_private.is_wechat_session() OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=sid AND user_id=auth.uid()) THEN
 RAISE EXCEPTION '请先验证并登录原 Web 账号' USING ERRCODE='42501'; END IF;
 DELETE FROM chob_private.wechat_link_codes WHERE user_id=auth.uid() OR expires_at<now();
 code:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 INSERT INTO chob_private.wechat_link_codes VALUES(sha256(convert_to(code,'UTF8')),auth.uid(),sid,now()+interval '5 minutes',NULL);
 RETURN code;
END $$;
CREATE OR REPLACE FUNCTION public.chob_wechat_bind(app_id text,open_id text,link_code text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item chob_private.wechat_link_codes; existing uuid;
BEGIN
 SELECT * INTO item FROM chob_private.wechat_link_codes WHERE digest=sha256(convert_to(link_code,'UTF8')) FOR UPDATE;
 IF NOT FOUND OR item.used_at IS NOT NULL OR item.expires_at<=now() OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=item.session_id AND user_id=item.user_id) THEN RAISE EXCEPTION '绑定码失效，请在 Web 重新生成'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=item.user_id AND is_active AND email_verified) THEN RAISE EXCEPTION '原账号不可用'; END IF;
 SELECT user_id INTO existing FROM chob_private.wechat_identities w WHERE w.app_id=chob_wechat_bind.app_id AND w.open_id=chob_wechat_bind.open_id;
 IF existing IS NOT NULL AND existing<>item.user_id THEN RAISE EXCEPTION '此微信已绑定其他账号，不能自动合并'; END IF;
 INSERT INTO chob_private.wechat_identities VALUES(app_id,open_id,item.user_id) ON CONFLICT ON CONSTRAINT wechat_identities_pkey DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM chob_private.wechat_identities w WHERE w.app_id=chob_wechat_bind.app_id AND w.open_id=chob_wechat_bind.open_id AND w.user_id=item.user_id) THEN RAISE EXCEPTION '账号绑定冲突'; END IF;
 UPDATE chob_private.wechat_link_codes SET used_at=now() WHERE digest=item.digest;
 RETURN item.user_id;
END $$;
CREATE OR REPLACE FUNCTION public.chob_wechat_register_session(app_id text,open_id text,session_id uuid,linked_user uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM chob_private.wechat_identities w WHERE w.app_id=chob_wechat_register_session.app_id AND w.open_id=chob_wechat_register_session.open_id AND w.user_id=linked_user)
 OR NOT EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=chob_wechat_register_session.session_id AND s.user_id=linked_user) THEN RAISE EXCEPTION 'Invalid session identity'; END IF;
 INSERT INTO chob_private.wechat_sessions VALUES(session_id,linked_user,app_id,NULL,now());
END $$;
CREATE OR REPLACE FUNCTION public.chob_wechat_logout() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE chob_private.wechat_sessions SET revoked_at=now() WHERE session_id=nullif(auth.jwt()->>'session_id','')::uuid AND user_id=auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.chob_wechat_link_code(),public.chob_wechat_logout() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chob_wechat_link_code(),public.chob_wechat_logout() TO authenticated;
REVOKE ALL ON FUNCTION public.chob_wechat_bind(text,text,text),public.chob_wechat_register_session(text,text,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chob_wechat_bind(text,text,text),public.chob_wechat_register_session(text,text,uuid,uuid) TO service_role;
-- Private account reads must also reject revoked mini sessions. Web policies keep their original meaning.
DO $policies$
DECLARE name text;
BEGIN
 FOREACH name IN ARRAY ARRAY['chob_personal','chob_corrections','chob_messages','chob_submission_reviews'] LOOP
  EXECUTE format('DROP POLICY IF EXISTS chob_wechat_live_session ON public.%I',name);
  EXECUTE format('CREATE POLICY chob_wechat_live_session ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING(chob_private.wechat_session_active())',name);
 END LOOP;
END $policies$;
CREATE OR REPLACE FUNCTION public.chob_mini_submissions() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT chob_private.active_member() THEN RAISE EXCEPTION '请先登录' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC),'[]'::jsonb) FROM public.chob_submission_reviews r WHERE r.user_id=auth.uid());
END $$;
INSERT INTO chob_private.migrations(version) VALUES('033') ON CONFLICT DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;
