import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicFeedClient, retryAfterTime } from '../src/api/feedClient.js';

test('rate limits retain status and the server retry time without repeat requests', async () => {
  let time = 100000, calls = 0;
  const read = createPublicFeedClient({ endpoint: 'https://calendar.test/feed', now: () => time,
    fetcher: async () => {
      calls++;
      return calls === 1 ? { ok: false, status: 429, headers: { get: () => '60' } }
        : { ok: true, json: async () => ({ records: [] }) };
    } });
  await assert.rejects(read({ start: '2026-10-01', page: 0 }), error => error.status === 429 && error.retryAt === 160000);
  for (let i = 0; i < 10; i++) await assert.rejects(read({ artist_query: 'Landokmai' }), error => error.status === 429 && error.retryAt === 160000);
  assert.equal(calls, 1);
  time = 160000;
  assert.deepEqual(await read({ start: '2026-10-01', page: 0 }), { records: [] });
  assert.equal(calls, 2);
});

test('retry time supports dates and a safe default when the header is hidden', () => {
  const time = Date.parse('2026-10-20T12:00:00Z');
  assert.equal(retryAfterTime(null, time), time + 60000);
  assert.equal(retryAfterTime('Tue, 20 Oct 2026 12:01:30 GMT', time), time + 90000);
  assert.equal(retryAfterTime('unreadable', time), time + 60000);
  assert.equal(retryAfterTime('0', time), time + 1000);
});

test('details and artist searches share in-flight requests and a short cache', async () => {
  let time = 0, calls = 0, release;
  const read = createPublicFeedClient({ endpoint: 'https://calendar.test/feed', now: () => time,
    fetcher: async () => {
      calls++;
      if (calls === 1) await new Promise(resolve => { release = resolve; });
      return { ok: true, json: async () => ({ artists: [{ id: 'one' }] }) };
    } });
  const first = read({ artist_query: 'Landokmai' }), second = read({ artist_query: 'Landokmai' });
  assert.equal(calls, 1);
  release();
  assert.deepEqual(await first, await second);
  await read({ artist_query: 'Landokmai' });
  assert.equal(calls, 1);
  time = 30000;
  await read({ artist_query: 'Landokmai' });
  assert.equal(calls, 2);
  await read({ start: '2026-10-01', end: '2026-11-01', page: 0 });
  await read({ start: '2026-10-01', end: '2026-11-01', page: 0 });
  assert.equal(calls, 4, 'a successful calendar refresh starts a fresh request');
  await read({ artist_query: 'Landokmai' });
  assert.equal(calls, 5, 'a calendar refresh invalidates older lookup results');
});

test('other HTTP failures retain their status', async () => {
  const read = createPublicFeedClient({ endpoint: 'https://calendar.test/feed',
    fetcher: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(read({}), error => error.status === 503 && error.retryAt === 0);
});
