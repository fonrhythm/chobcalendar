import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/feed.js';
const env = {SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-secret',ALLOWED_ORIGINS:'https://fonrhythm.github.io',FEED_LIMITER:{limit:async()=>({success:true})}};
const req = (body='{}',extra={})=>new Request('https://gateway.test/feed',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.1',Origin:'https://fonrhythm.github.io',...extra},body});
test('missing limiter, IP, configuration and limiter failures fail closed',async()=>{
 for (const overrides of [{FEED_LIMITER:null},{SUPABASE_SERVICE_ROLE_KEY:''},{ALLOWED_ORIGINS:''},{FEED_LIMITER:{limit:async()=>{throw Error('offline')}}}]) assert.equal((await worker.fetch(req(),{...env,...overrides})).status,503);
 const r=req();r.headers.delete('CF-Connecting-IP');assert.equal((await worker.fetch(r,env)).status,503);
});
test('rate limit checked before upstream, with trusted IP key',async()=>{
 let key; const r=await worker.fetch(req(),{...env,FEED_LIMITER:{limit:async args=>{key=args.key;return {success:false}}}});
 assert.equal(key,'feed:192.0.2.1');assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'60');
});
test('reject alternative routes, methods, origins and arbitrary arguments',async()=>{
 assert.equal((await worker.fetch(new Request('https://gateway.test/rpc/anything'),env)).status,404);
 assert.equal((await worker.fetch(new Request('https://gateway.test/feed?all=1'),env)).status,404);
 assert.equal((await worker.fetch(new Request('https://gateway.test/feed'),env)).status,405);
 assert.equal((await worker.fetch(req('{}',{Origin:'https://evil.test'}),env)).status,403);
 for(const body of ['[]','null','{"rpc":"other"}','broken']) assert.equal((await worker.fetch(req(body),env)).status,400);
 assert.equal((await worker.fetch(req(' '.repeat(2049)),env)).status,413);
});
test('preflight supports browser and no-origin clients still hit limiter',async()=>{
 assert.equal((await worker.fetch(new Request('https://gateway.test/feed',{method:'OPTIONS',headers:{Origin:env.ALLOWED_ORIGINS}}),env)).status,204);
 const r=req();r.headers.delete('Origin');assert.equal((await worker.fetch(r,{...env,FEED_LIMITER:{limit:async()=>({success:false})}})).status,429);
});
test('only fixed RPC uses server secret; response and errors never expose it',async()=>{
 const original=globalThis.fetch;let captured;
 try{
  globalThis.fetch=async(url,options)=>{captured={url,options};return Response.json({records:[],artists:[],types:[]})};
  const response=await worker.fetch(req(),env);assert.equal(response.status,200);
  assert.equal(captured.url,env.SUPABASE_URL+'/rest/v1/rpc/chob_public_feed');
  assert.equal(captured.options.headers.Authorization,'Bearer test-secret');
  assert.equal(captured.options.body,'{}');assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),env.ALLOWED_ORIGINS);
  assert.equal((await response.text()).includes('test-secret'),false);
  globalThis.fetch=async()=>new Response('test-secret',{status:403});
  const failed=await worker.fetch(req(),env);assert.equal(failed.status,502);assert.equal((await failed.text()).includes('test-secret'),false);
  globalThis.fetch=async()=>Response.json({unexpected:true});assert.equal((await worker.fetch(req(),env)).status,502);
 } finally {globalThis.fetch=original}
});

