import test from 'node:test';
import assert from 'node:assert/strict';
import { getBoundFeed } from '../src/boundFeed.js';
import { normalizeClientIp } from '../src/clientIp.js';
import feed from '../src/feed.js';

const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  ALLOWED_ORIGINS: 'https://chobcalendar.pages.dev', FEED_LIMITER: { limit: async () => ({ success: true }) } };

test('binding queries use the same trusted IP limiter key as public HTTP requests', async () => {
  const keys = [], limited = { ...env, FEED_LIMITER: { limit: async ({ key }) => { keys.push(key); return { success: false }; } } };
  assert.equal((await getBoundFeed('{}', '2001:db8::1', limited)).status, 429);
  const direct = new Request('https://worker.test/feed', { method: 'POST', body: '{}',
    headers: { 'CF-Connecting-IP': '2001:0db8:0:0:0:0:0:1', 'X-Client-IP': '198.51.100.4' } });
  assert.equal((await feed.fetch(direct, limited)).status, 429);
  assert.deepEqual(keys, ['feed:2001:db8::1', 'feed:2001:db8::1']);
});

test('untrusted HTTP headers and body arguments cannot supply a missing edge IP', async () => {
  let calls = 0;
  const config = { ...env, FEED_LIMITER: { limit: async () => { calls++; return { success: false }; } } };
  const request = new Request('https://worker.test/feed', { method: 'POST',
    headers: { 'X-Forwarded-For': '192.0.2.1', 'X-Client-IP': '192.0.2.1', 'True-Client-IP': '192.0.2.1' },
    body: '{"ip":"192.0.2.1","trustedClientIp":"192.0.2.1"}' });
  assert.equal((await feed.fetch(request, config)).status, 503);
  assert.equal(calls, 0);
  for (const ip of [undefined, null, '', '1234.1.2.3', '1.2.3.999', '192.0.2.1,192.0.2.2', ':::', 'a'.repeat(46)]) {
    assert.equal((await getBoundFeed('{}', ip, config)).status, 503);
  }
  assert.equal(calls, 0);
  assert.equal(normalizeClientIp('::ffff:192.0.2.1'), '::ffff:c000:201');
});

test('RPC accepts raw bounded public queries, never a URL, RPC name or arbitrary headers', async () => {
  const original = globalThis.fetch;
  let upstream = 0;
  globalThis.fetch = async () => { upstream++; throw Error('unexpected upstream'); };
  try {
    for (const body of [undefined, {}, new Request('https://evil.test'), '[]', 'null',
      '{"url":"https://evil.test"}', '{"requestURL":"https://evil.test"}',
      '{"rpc":"chob_admin_delete"}', '{"headers":{"Authorization":"attacker"}}',
      '{"ip":"198.51.100.4"}', '{"all":true}']) {
      assert.equal((await getBoundFeed(body, '192.0.2.1', env)).status, 400);
    }
    assert.equal((await getBoundFeed('界'.repeat(683), '192.0.2.1', env)).status, 413);
    assert.equal(upstream, 0);
  } finally { globalThis.fetch = original; }
});

test('bound feed keeps the fixed upstream, public projection and secret-safe errors', async () => {
  const original = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return Response.json({ records: [], artists: [], types: [] });
  };
  try {
    const response = await getBoundFeed('{}', '192.0.2.1', env);
    assert.equal(response.status, 200);
    assert.equal(captured.url, env.SUPABASE_URL + '/rest/v1/rpc/chob_public_feed');
    assert.equal(captured.options.body, '{}');
    assert.equal(captured.options.headers.Authorization, 'Bearer server-secret');
    assert.equal(captured.options.headers.Cookie, undefined);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://chobcalendar.pages.dev');
    assert.doesNotMatch(await response.text(), /server-secret/);
    globalThis.fetch = async () => { throw Error('server-secret'); };
    const failed = await getBoundFeed('{}', '192.0.2.1', env);
    assert.equal(failed.status, 502);
    assert.doesNotMatch(await failed.text(), /server-secret/);
  } finally { globalThis.fetch = original; }
});
