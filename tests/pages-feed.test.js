import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/feed.js';
import { getBoundFeed } from '../miniprogram/worker/src/boundFeed.js';
import worker from '../miniprogram/worker/src/feed.js';

const endpoint = 'https://chobcalendar.pages.dev/api/feed';
const make = (body = '{}', headers = {}, url = endpoint, method = 'POST') => new Request(url, {
  method, headers: { 'CF-Connecting-IP': '192.0.2.1', Origin: 'https://chobcalendar.pages.dev', ...headers },
  ...(method === 'POST' ? { body } : {}),
});

test('same-origin feed passes only bounded raw JSON and the edge IP to its RPC', async () => {
  const seen = [], answer = Response.json({ records: [] });
  const env = { CALENDAR_FEED: { getFeed: async (...args) => { seen.push(args); return answer; } } };
  const body = '{"start":"2026-10-01","end":"2026-10-31","page":0}';
  const response = await onRequest({ request: make(body, {
    Authorization: 'Bearer client-token', Cookie: 'session=private', 'X-Forwarded-For': '198.51.100.99',
    'X-Client-IP': '198.51.100.99',
  }), env });
  assert.equal(response, answer);
  assert.deepEqual(seen, [[body, '192.0.2.1']]);
  const noOrigin = make(); noOrigin.headers.delete('Origin');
  assert.equal((await onRequest({ request: noOrigin, env })).status, 200);
});

test('only POST without query and an exact same origin is admitted', async () => {
  let calls = 0;
  const env = { CALENDAR_FEED: { getFeed: async () => { calls++; return Response.json({}); } } };
  for (const [request, status] of [
    [make('{}', {}, endpoint, 'GET'), 405],
    [make('{}', {}, endpoint, 'OPTIONS'), 405],
    [make('{}', {}, endpoint + '?rpc=anything'), 404],
    [make('{}', {}, 'https://chobcalendar.pages.dev/api/other'), 404],
    [make('{}', { Origin: 'https://evil.test' }), 403],
    [make('{}', { Origin: 'null' }), 403],
    [make('{}', { Origin: '' }), 403],
  ]) assert.equal((await onRequest({ request, env })).status, status);
  assert.equal(calls, 0);
});

test('a missing binding or an invalid edge IP fails closed without trusting alternate IP headers', async () => {
  let calls = 0;
  const env = { CALENDAR_FEED: { getFeed: async () => { calls++; return Response.json({}); } } };
  assert.equal((await onRequest({ request: make(), env: {} })).status, 503);
  assert.equal((await onRequest({ request: make(), env: { CALENDAR_FEED: {} } })).status, 503);
  for (const ip of ['', '999.1.2.3', '127.0.0.1,198.51.100.1', 'https://host.test', 'a'.repeat(46), ':::']) {
    assert.equal((await onRequest({ request: make('{}', { 'CF-Connecting-IP': ip, 'X-Forwarded-For': '192.0.2.55' }), env })).status, 503);
  }
  const missing = make('{}', { 'X-Real-IP': '192.0.2.99' }); missing.headers.delete('CF-Connecting-IP');
  assert.equal((await onRequest({ request: missing, env })).status, 503);
  assert.equal(calls, 0);
});

test('declared and streaming bodies have a hard 2048-byte cap before RPC', async () => {
  let calls = 0, cancelled = false;
  const env = { CALENDAR_FEED: { getFeed: async () => { calls++; return Response.json({}); } } };
  assert.equal((await onRequest({ request: make('{}', { 'Content-Length': '2049' }), env })).status, 413);
  assert.equal((await onRequest({ request: make('界'.repeat(683)), env })).status, 413);
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(1024)); controller.enqueue(new Uint8Array(1025)); },
    cancel() { cancelled = true; },
  });
  const request = new Request(endpoint, { method: 'POST', headers: { 'CF-Connecting-IP': '192.0.2.1' }, body: stream, duplex: 'half' });
  assert.equal((await onRequest({ request, env })).status, 413);
  assert.equal(cancelled, true);
  assert.equal(calls, 0);
  assert.equal((await onRequest({ request: make(' '.repeat(2048)), env })).status, 200);
});

test('binding failures return a generic response without server or session secrets', async () => {
  const response = await onRequest({ request: make(), env: { CALENDAR_FEED: { getFeed() {
    throw Error('SUPABASE_SERVICE_ROLE_KEY=never-return COOKIE=private');
  } } } });
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /never-return|private|SUPABASE/);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
});

test('Pages RPC and direct HTTP share the original client limiter key, not forged IP data', async () => {
  const keys = [];
  const workerEnv = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'never-return',
    ALLOWED_ORIGINS: 'https://chobcalendar.pages.dev', FEED_LIMITER: { limit: async ({ key }) => { keys.push(key); return { success: false }; } } };
  const env = { CALENDAR_FEED: { getFeed: (raw, ip) => getBoundFeed(raw, ip, workerEnv) } };
  const response = await onRequest({ request: make('{}', { 'X-Client-IP': '198.51.100.2' }), env });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  const direct = new Request('https://worker.test/feed', { method: 'POST', headers: {
    'CF-Connecting-IP': '192.0.2.1', 'X-Real-IP': '198.51.100.2', 'X-Forwarded-For': '198.51.100.2',
  }, body: '{"ip":"198.51.100.2"}' });
  assert.equal((await worker.fetch(direct, workerEnv)).status, 429);
  assert.deepEqual(keys, ['feed:192.0.2.1', 'feed:192.0.2.1']);
});
