// Only this fixed RPC is reachable. Never proxy a user-supplied URL or RPC name.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' };
    if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (body, status, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
    if (url.pathname !== '/feed' || url.search) return reply({error:'Not found'}, 404);
    if (!allowed.length) return reply({error:'Feed temporarily unavailable'},503);
    // CORS is browser compatibility, not authentication. Non-browser callers
    // can omit or forge Origin; the trusted edge IP limiter applies to all.
    if (origin && !allowed.includes(origin)) return reply({error:'Origin not allowed'}, 403);
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    if (request.method !== 'POST') return reply({error:'Method not allowed'},405,{Allow:'POST'});
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.FEED_LIMITER || !allowed.length) return reply({error:'Feed temporarily unavailable'},503);
    // Cloudflare injects this header at its edge. Do not trust X-Forwarded-For.
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return reply({error:'Feed temporarily unavailable'},503);
    try {
      const result = await env.FEED_LIMITER.limit({key:'feed:' + ip});
      if (!result.success) return reply({error:'请求过于频繁，请稍后再试。'},429,{'Retry-After':'60'});
    } catch { return reply({error:'Feed temporarily unavailable'},503); }
    // No query parameters accepted; cap and cancel streaming oversized bodies.
    if (request.body) {
      const reader = request.body.getReader(); let bytes=0, chunks=[];
      while (true) {
        const {done,value} = await reader.read(); if (done) break;
        bytes += value.byteLength;
        if (bytes > 128) { await reader.cancel(); return reply({error:'Request too large'},413); }
        chunks.push(value);
      }
      try {
        const body = new Uint8Array(bytes); let offset=0;
        for (const chunk of chunks) { body.set(chunk,offset); offset+=chunk.length; }
        const raw = new TextDecoder().decode(body);
        const args = raw ? JSON.parse(raw) : {};
        if (!args || Array.isArray(args) || typeof args !== 'object' || Object.keys(args).length) return reply({error:'Invalid parameters'},400);
      } catch { return reply({error:'Invalid JSON'},400); }
    }
    try {
      const upstream = await fetch(env.SUPABASE_URL.replace(/\/$/,'') + '/rest/v1/rpc/chob_public_feed', {
        method:'POST', headers:{'Content-Type':'application/json',apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},
        body:'{}', signal:AbortSignal.timeout(15000), redirect:'manual'
      });
      if (!upstream.ok) {
        let code; try { const error=await upstream.json(); if (/^(PGRST[0-9]{3}|[0-9]{5})$/.test(error.code || '')) code=error.code; } catch {}
        console.log(JSON.stringify({scope:'public_feed',event:'upstream_failed',status:upstream.status,...(code?{code}:{})}));
        return reply({error:'Feed temporarily unavailable'},502);
      }
      const feed = await upstream.json();
      if (!feed || !Array.isArray(feed.records) || !Array.isArray(feed.artists)) return reply({error:'Invalid feed response'},502);
      return reply(feed,200);
    } catch (error) { console.log(JSON.stringify({scope:'public_feed',event:'request_failed',kind:['TimeoutError','TypeError','SyntaxError'].includes(error?.name)?error.name:'upstream_exception',redirect_error:/redirect/i.test(error?.message||''),header_error:/header/i.test(error?.message||''),url_error:/url/i.test(error?.message||'')})); return reply({error:'Feed temporarily unavailable'},502); }
  }
};
