const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function remote(url,init){const r=await fetch(url,{...init,signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw Error('Upstream request failed');return data}
async function identityEmail(env,openid){const encoder=new TextEncoder();const key=await crypto.subtle.importKey('raw',encoder.encode(env.IDENTITY_HMAC_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(env.WECHAT_APP_ID+':'+openid));return 'wx-'+Array.from(new Uint8Array(signature)).map(b=>b.toString(16).padStart(2,'0')).join('')+'@wechat.chob.invalid'}
export default {async fetch(request,env){
 const url=new URL(request.url);if(url.pathname==='/health')return json({ok:true});
 if(!['/login','/bind'].includes(url.pathname)||request.method!=='POST')return json({error:'Not found'},404);
 if(!env.WECHAT_APP_ID||!env.WECHAT_APP_SECRET||!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!env.IDENTITY_HMAC_SECRET)return json({error:'登录服务尚未配置'},503);
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';if(!env.LOGIN_LIMITER)return json({error:'Login rate limiter unavailable'},503);
 if(!(await env.LOGIN_LIMITER.limit({key:ip})).success)return json({error:'请求过于频繁，请稍后重试'},429);
 try{
  if(Number(request.headers.get('content-length'))>2048)return json({error:'Request too large'},413);
  const raw=await request.text();if(raw.length>2048)return json({error:'Request too large'},413);
  const {code,link_code}=JSON.parse(raw);if(url.pathname==='/bind'&&(typeof link_code!=='string'||! /^[0-9a-f]{64}$/.test(link_code)))return json({error:'绑定码格式无效'},400);if(typeof code!=='string'||!code||code.length>512)return json({error:'Invalid login code'},400);
  const wxurl=new URL('https://api.weixin.qq.com/sns/jscode2session');wxurl.search=new URLSearchParams({appid:env.WECHAT_APP_ID,secret:env.WECHAT_APP_SECRET,js_code:code,grant_type:'authorization_code'});
  const wechat=await remote(wxurl);if(wechat.errcode||!wechat.openid)return json({error:'微信登录凭证失效，请重试'},401);
  const headers={'content-type':'application/json',apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
  const rpc=args=>remote(env.SUPABASE_URL+'/rest/v1/rpc/chob_wechat_identity',{method:'POST',headers,body:JSON.stringify(args)});
  const args={app_id:env.WECHAT_APP_ID,open_id:wechat.openid};let uid,email;if(url.pathname==='/bind'){try{uid=await remote(env.SUPABASE_URL+'/rest/v1/rpc/chob_wechat_bind',{method:'POST',headers,body:JSON.stringify({...args,link_code})});if(!uid)throw Error('Missing verified binding')}catch{return json({error:'绑定码失效或账号绑定冲突，请在 Web 重新生成；已绑定其他账号的微信不能自动合并'},409)}}else uid=await rpc(args);
  if(uid){const user=await remote(env.SUPABASE_URL+'/auth/v1/admin/users/'+uid,{headers});email=user.email;if(!email)throw Error('Missing identity email')}
  else email=await identityEmail(env,wechat.openid);
  const link=await remote(env.SUPABASE_URL+'/auth/v1/admin/generate_link',{method:'POST',headers,body:JSON.stringify({type:'magiclink',email})});
  const session=await remote(env.SUPABASE_URL+'/auth/v1/verify',{method:'POST',headers,body:JSON.stringify({token_hash:link.hashed_token,type:link.verification_type})});
  if(uid&&session.user?.id!==uid)throw Error('Identity mismatch');
  if(!uid){uid=await rpc({...args,linked_user:session.user.id});if(uid!==session.user.id)throw Error('Identity binding conflict')}
  const claims=JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  if(claims.sub!==session.user.id||!claims.session_id)throw Error('Invalid session claims');
  await remote(env.SUPABASE_URL+'/rest/v1/rpc/chob_wechat_register_session',{method:'POST',headers,body:JSON.stringify({...args,session_id:claims.session_id,linked_user:session.user.id})});
  // Do not expose openid, session_key, admin keys or one-time login links.
  return json({access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in,expires_at:session.expires_at,user:{id:session.user.id}});
 }catch{return json({error:'登录暂时失败，请稍后重试'},502)}
}};
export {identityEmail};

