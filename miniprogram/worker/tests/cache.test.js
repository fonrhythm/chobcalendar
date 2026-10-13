import {test} from 'node:test';import assert from 'node:assert/strict';import worker from '../src/feed.js';
test('public cache reduces repeated database reads but never bypasses limiter',async()=>{
const originalFetch=globalThis.fetch,originalCaches=globalThis.caches;let calls=0,denied=false;const entries=new Map();
const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-secret',ALLOWED_ORIGINS:'https://site.test',FEED_LIMITER:{limit:async()=>({success:!denied})}};
const request=()=>new Request('https://gateway.test/feed',{method:'POST',headers:{'CF-Connecting-IP':'192.0.2.1'},body:'{}'});
try{
globalThis.caches={default:{match:async key=>entries.get(key.url)?.clone(),put:async(key,value)=>entries.set(key.url,value.clone())}};
globalThis.fetch=async()=>{calls++;return Response.json({records:[{id:1}],artists:[]})};
assert.equal((await worker.fetch(request(),env)).status,200);assert.equal((await worker.fetch(request(),env)).status,200);assert.equal(calls,1);
denied=true;assert.equal((await worker.fetch(request(),env)).status,429);assert.equal(calls,1);
}finally{globalThis.fetch=originalFetch;if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches}
});

