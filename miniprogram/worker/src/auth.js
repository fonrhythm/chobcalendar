var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } }), "json");
var authErrorCodes = /* @__PURE__ */ new Set(["unexpected_failure", "validation_failed", "email_address_invalid", "signup_disabled", "user_already_exists", "invalid_credentials", "email_not_confirmed", "bad_jwt", "over_request_rate_limit", "over_email_send_rate_limit", "user_not_found"]);
var internalErrors = /* @__PURE__ */ new Set(["Upstream request failed", "Missing identity email", "Identity mismatch", "Identity binding conflict", "Invalid session claims"]);
function safeUpstreamError(data) {
  const code = data?.code ?? data?.error_code;
  if (typeof code === "string" && (/^(PGRST[0-9]{3}|[0-9]{5})$/.test(code) || authErrorCodes.has(code))) return { error_code: code };
  if (Number.isSafeInteger(data?.errcode) && data.errcode !== 0) return { wechat_errcode: data.errcode };
  return {};
}
__name(safeUpstreamError, "safeUpstreamError");
async function remote(url, init, diagnostic) {
  let status;
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15e3) });
    status = r.status;
    const data = r.ok && status === 204 ? null : await r.json();
    diagnostic?.({ event: "upstream_response", http_status: status, ...safeUpstreamError(data) });
    if (!r.ok) throw Error("Upstream request failed");
    return data;
  } catch (error) {
    diagnostic?.({ event: "upstream_failed", ...status === void 0 ? {} : { http_status: status }, error: internalErrors.has(error?.message) ? error.message : error?.name === "TimeoutError" ? "timeout" : error?.name === "SyntaxError" ? "invalid_json" : "upstream_exception" });
    throw error;
  }
}
__name(remote, "remote");
async function identityEmail(env, openid) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.IDENTITY_HMAC_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(env.WECHAT_APP_ID + ":" + openid));
  return "wx-" + Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("") + "@wechat.chob.invalid";
}
__name(identityEmail, "identityEmail");
var index_default = { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/health") return json({ ok: true });
  if (!["/login", "/bind"].includes(url.pathname) || request.method !== "POST") return json({ error: "Not found" }, 404);
  if (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.IDENTITY_HMAC_SECRET) return json({ error: "\u767B\u5F55\u670D\u52A1\u5C1A\u672A\u914D\u7F6E" }, 503);
  const diagnosticId = url.pathname === "/login" ? crypto.randomUUID() : null;
  let stage = "request_validation";
  const log = /* @__PURE__ */ __name((details) => {
    if (diagnosticId) console.log(JSON.stringify({ scope: "wechat_login", diagnostic_id: diagnosticId, stage, ...details }));
  }, "log");
  const begin = /* @__PURE__ */ __name((name) => {
    stage = name;
    log({ event: "step_started" });
  }, "begin");
  const upstream = /* @__PURE__ */ __name((name, target, init) => {
    begin(name);
    return remote(target, init, log);
  }, "upstream");
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!env.LOGIN_LIMITER) return json({ error: "Login rate limiter unavailable" }, 503);
  if (!(await env.LOGIN_LIMITER.limit({ key: ip })).success) return json({ error: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 429);
  try {
    if (Number(request.headers.get("content-length")) > 2048) return json({ error: "Request too large" }, 413);
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: "Request too large" }, 413);
    const { code, link_code } = JSON.parse(raw);
    if (url.pathname === "/bind" && (typeof link_code !== "string" || !/^[0-9a-f]{64}$/.test(link_code))) return json({ error: "\u7ED1\u5B9A\u7801\u683C\u5F0F\u65E0\u6548" }, 400);
    if (typeof code !== "string" || !code || code.length > 512) return json({ error: "Invalid login code" }, 400);
    const wxurl = new URL("https://api.weixin.qq.com/sns/jscode2session");
    wxurl.search = new URLSearchParams({ appid: env.WECHAT_APP_ID, secret: env.WECHAT_APP_SECRET, js_code: code, grant_type: "authorization_code" });
    const wechat = await upstream("code2Session", wxurl);
    if (wechat.errcode || !wechat.openid) {
      log({ event: "step_rejected", ...safeUpstreamError(wechat), error: "wechat_identity_unavailable" });
      return json({ error: "\u5FAE\u4FE1\u767B\u5F55\u51ED\u8BC1\u5931\u6548\uFF0C\u8BF7\u91CD\u8BD5" }, 401);
    }
    ;
    const headers = { "content-type": "application/json", apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
    const rpc = /* @__PURE__ */ __name((args2) => upstream(args2.linked_user ? "supabase_identity_map" : "supabase_identity_query", env.SUPABASE_URL + "/rest/v1/rpc/chob_wechat_identity", { method: "POST", headers, body: JSON.stringify(args2) }), "rpc");
    const args = { app_id: env.WECHAT_APP_ID, open_id: wechat.openid };
    let uid, email;
    if (url.pathname === "/bind") {
      try {
        uid = await remote(env.SUPABASE_URL + "/rest/v1/rpc/chob_wechat_bind", { method: "POST", headers, body: JSON.stringify({ ...args, link_code }) });
        if (!uid) throw Error("Missing verified binding");
      } catch {
        return json({ error: "\u7ED1\u5B9A\u7801\u5931\u6548\u6216\u8D26\u53F7\u7ED1\u5B9A\u51B2\u7A81\uFF0C\u8BF7\u5728 Web \u91CD\u65B0\u751F\u6210\uFF1B\u5DF2\u7ED1\u5B9A\u5176\u4ED6\u8D26\u53F7\u7684\u5FAE\u4FE1\u4E0D\u80FD\u81EA\u52A8\u5408\u5E76" }, 409);
      }
    } else uid = await rpc(args);
    if (uid) {
      const user = await upstream("supabase_user_query", env.SUPABASE_URL + "/auth/v1/admin/users/" + uid, { headers });
      email = user.email;
      if (!email) throw Error("Missing identity email");
    } else {
      begin("identity_email");
      email = await identityEmail(env, wechat.openid);
      log({ event: "step_completed" });
    }
    ;
    const link = await upstream("supabase_session_generate", env.SUPABASE_URL + "/auth/v1/admin/generate_link", { method: "POST", headers, body: JSON.stringify({ type: "magiclink", email }) });
    const session = await upstream("supabase_session_verify", env.SUPABASE_URL + "/auth/v1/verify", { method: "POST", headers, body: JSON.stringify({ token_hash: link.hashed_token, type: link.verification_type }) });
    begin("session_identity_validation");
    if (uid && session.user?.id !== uid) throw Error("Identity mismatch");
    if (!uid) {
      uid = await rpc({ ...args, linked_user: session.user.id });
      if (uid !== session.user.id) throw Error("Identity binding conflict");
    }
    begin("session_claims_validation");
    const claims = JSON.parse(atob(session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (claims.sub !== session.user.id || !claims.session_id) throw Error("Invalid session claims");
    await upstream("supabase_session_register", env.SUPABASE_URL + "/rest/v1/rpc/chob_wechat_register_session", { method: "POST", headers, body: JSON.stringify({ ...args, session_id: claims.session_id, linked_user: session.user.id }) });
    log({ event: "login_completed" });
    return json({ access_token: session.access_token, refresh_token: session.refresh_token, expires_in: session.expires_in, expires_at: session.expires_at, user: { id: session.user.id } });
  } catch (error) {
    log({ event: "login_failed", error: internalErrors.has(error?.message) ? error.message : "login_exception" });
    return json({ error: "\u767B\u5F55\u6682\u65F6\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 502);
  }
} };
export {
  index_default as default,
  identityEmail
};
//# sourceMappingURL=index.js.map