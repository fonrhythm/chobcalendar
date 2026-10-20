import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFeedSync } from '../src/utils/feedSync.js';
import { createFeedPageLoader } from '../src/utils/feedWindow.js';

// Drain promise continuations without introducing real delays into these tests.
async function settle() {
  for (let index = 0; index < 100; index++) await Promise.resolve();
}

function fakeClock() {
  let time = 0;
  let sequence = 0;
  const timers = new Map();
  return {
    now: () => time,
    setTimer(callback, delay = 0) {
      const id = ++sequence;
      timers.set(id, { callback, at: time + Math.max(0, delay) });
      return id;
    },
    clearTimer: id => timers.delete(id),
    get pending() { return timers.size; },
    async advance(duration) {
      const target = time + duration;
      await settle();
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) break;
        const [id, timer] = due;
        time = timer.at;
        timers.delete(id);
        timer.callback();
        await settle();
      }
      time = target;
      await settle();
    },
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function page(index, last = index) {
  return {
    records: [{ id: `event-${index}` }],
    artists: [{ id: 'shared-artist' }, { id: `artist-${index}` }],
    announcements: [{ id: 'shared-notice' }],
    types: ['show'],
    conditions: [],
    next_page: index < last ? index + 1 : null,
  };
}

const october = { start: '2026-09-24', end: '2026-11-07', region: 'thailand' };
const november = { start: '2026-10-25', end: '2026-12-07', region: 'thailand' };

test('an eleven-page feed resumes after the ten-request limit and only publishes a complete feed', async () => {
  const clock = fakeClock();
  const requests = [];
  const successes = [];
  const errors = [];
  const rateLimit = Object.assign(new Error('too many requests'), { status: 429, retryAt: 60000 });
  const loader = createFeedPageLoader(async (_name, args) => {
    requests.push({ page: args.page, at: clock.now() });
    if (args.page === 10 && clock.now() < 60000) throw rateLimit;
    return page(args.page, 10);
  }, clock);
  const sync = createFeedSync({
    ...clock, load: loader.load,
    onSuccess: feed => successes.push(feed),
    onError: error => errors.push(error),
  });

  assert.equal((await sync.sync(october)).error, rateLimit);
  assert.equal(successes.length, 0, 'ten completed pages must not appear as a complete calendar');
  assert.deepEqual(errors, [rateLimit]);
  assert.deepEqual(requests.map(request => request.page), Array.from({ length: 11 }, (_, index) => index));
  assert.equal(clock.pending, 1, 'only one cooldown retry should remain');

  for (let index = 0; index < 10; index++) {
    const result = await sync.sync(october, { force: true });
    assert.equal(result.cooldown, true, 'a manual refresh must respect the server cooldown');
  }
  assert.equal(requests.length, 11);
  assert.equal(errors.length, 1);
  assert.equal(clock.pending, 1, 'repeated focus or refresh events must not create more retries');
  await clock.advance(59999);
  assert.equal(requests.length, 11);
  assert.equal(successes.length, 0);
  await clock.advance(1);

  assert.deepEqual(requests.map(request => request.page), [...Array.from({ length: 11 }, (_, index) => index), 10]);
  assert.equal(successes.length, 1);
  assert.deepEqual(successes[0].records.map(record => record.id), Array.from({ length: 11 }, (_, index) => `event-${index}`));
  assert.equal(successes[0].artists.length, 12);
  assert.equal(successes[0].announcements.length, 1);
  assert.equal(clock.pending, 0);
});

test('ten foreground events share one request and a recently completed window skips automatic refreshes', async () => {
  const clock = fakeClock();
  const pending = deferred();
  let requests = 0;
  let starts = 0;
  let successes = 0;
  const sync = createFeedSync({
    ...clock,
    load: () => ++requests === 1 ? pending.promise : Promise.resolve(page(0)),
    onStart: () => starts++,
    onSuccess: () => successes++,
  });
  const runs = Array.from({ length: 10 }, () => sync.sync(october));
  assert.ok(runs.every(run => run === runs[0]), 'concurrent foreground events must share the same in-flight operation');
  await settle();
  assert.equal(requests, 1);
  assert.equal(starts, 1);
  pending.resolve(page(0));
  await Promise.all(runs);
  for (let index = 0; index < 10; index++) assert.equal((await sync.sync(october)).skipped, true);
  await clock.advance(59999);
  assert.equal((await sync.sync(october)).skipped, true);
  assert.equal(requests, 1);
  assert.equal(successes, 1);
  await clock.advance(1);
  await sync.sync(october);
  assert.equal(requests, 2);
  assert.equal(successes, 2);
});

test('a forced refresh bypasses the completed-window interval', async () => {
  const clock = fakeClock();
  let requests = 0;
  const sync = createFeedSync({ ...clock, load: async () => ({ records: [{ id: ++requests }] }) });
  await sync.sync(october);
  assert.equal((await sync.sync(october)).skipped, true);
  assert.equal((await sync.sync(october, { force: true })).feed.records[0].id, 2);
  assert.equal(requests, 2);
});

test('a transient page failure retries that page and a completed feed starts fresh on the next load', async () => {
  const clock = fakeClock();
  const requests = [];
  const failure = new Error('connection reset');
  let failOnce = true;
  const loader = createFeedPageLoader(async (_name, args) => {
    requests.push(args.page);
    if (args.page === 1 && failOnce) { failOnce = false; throw failure; }
    return page(args.page, 2);
  }, clock);
  await assert.rejects(loader.load(october), error => error === failure);
  assert.deepEqual(requests, [0, 1]);
  const recovered = await loader.load(october);
  assert.deepEqual(requests, [0, 1, 1, 2]);
  assert.deepEqual(recovered.records.map(record => record.id), ['event-0', 'event-1', 'event-2']);
  await loader.load(october);
  assert.deepEqual(requests, [0, 1, 1, 2, 0, 1, 2], 'success must discard the saved pagination cursor');
  assert.equal(clock.pending, 0);
});

test('late results from a previous month cannot overwrite the active month', async () => {
  const clock = fakeClock();
  const pending = [];
  const successes = [];
  const errors = [];
  const sync = createFeedSync({
    ...clock,
    load(args, signal) {
      const request = { ...deferred(), args, signal };
      pending.push(request);
      return request.promise; // Simulate a transport that ignores abort and replies late.
    },
    onSuccess: feed => successes.push(feed),
    onError: error => errors.push(error),
  });
  const oldRun = sync.sync(october);
  await settle();
  const newRun = sync.sync(november);
  await settle();
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve({ records: [{ id: 'november' }] });
  await newRun;
  pending[0].resolve({ records: [{ id: 'october-late' }] });
  assert.equal((await oldRun).cancelled, true);
  assert.deepEqual(successes.map(feed => feed.records[0].id), ['november']);
  assert.deepEqual(errors, []);
});

test('pagination progress belongs to its own date range', async () => {
  const clock = fakeClock();
  const requests = [];
  let failOnce = true;
  const loader = createFeedPageLoader(async (_name, args) => {
    requests.push([args.start, args.page]);
    if (args.start === october.start && args.page === 1 && failOnce) {
      failOnce = false;
      throw new Error('temporary failure');
    }
    return { ...page(args.page, 1), records: [{ id: `${args.start}:${args.page}` }] };
  }, clock);
  await assert.rejects(loader.load(october), /temporary failure/);
  const otherMonth = await loader.load(november);
  const resumed = await loader.load(october);
  assert.deepEqual(requests, [[october.start, 0], [october.start, 1], [november.start, 0], [november.start, 1], [october.start, 1]]);
  assert.deepEqual(otherMonth.records.map(record => record.id), [`${november.start}:0`, `${november.start}:1`]);
  assert.deepEqual(resumed.records.map(record => record.id), [`${october.start}:0`, `${october.start}:1`]);
});

test('four healthy 25-second pages complete beyond the old 60-second request limit', async () => {
  const clock = fakeClock();
  const requests = [];
  const successes = [];
  const errors = [];
  const loader = createFeedPageLoader((_name, args) => {
    requests.push({ page: args.page, at: clock.now() });
    return new Promise(resolve => clock.setTimer(() => resolve(page(args.page, 3)), 25000));
  }, clock);
  const sync = createFeedSync({ ...clock, load: loader.load, onSuccess: feed => successes.push(feed), onError: error => errors.push(error) });
  const run = sync.sync(october);
  await clock.advance(60000);
  assert.equal(successes.length, 0);
  assert.deepEqual(errors, []);
  await clock.advance(40000);
  const result = await run;
  assert.deepEqual(requests, [{ page: 0, at: 0 }, { page: 1, at: 25000 }, { page: 2, at: 50000 }, { page: 3, at: 75000 }]);
  assert.equal(result.feed.records.length, 4);
  assert.equal(successes.length, 1);
  assert.deepEqual(errors, []);
  assert.equal(clock.pending, 0);
});

test('a page timeout aborts only the stalled page and preserves completed pages for retry', async () => {
  const clock = fakeClock();
  const requests = [];
  let stalledSignal;
  let stallOnce = true;
  const loader = createFeedPageLoader(async (_name, args, signal) => {
    requests.push(args.page);
    if (args.page === 1 && stallOnce) {
      stallOnce = false;
      stalledSignal = signal;
      return new Promise(() => {});
    }
    return page(args.page, 1);
  }, clock);
  const failed = assert.rejects(loader.load(october), error => error.name === 'TimeoutError');
  await settle();
  assert.deepEqual(requests, [0, 1]);
  await clock.advance(30000);
  await failed;
  assert.equal(stalledSignal.aborted, true);
  const recovered = await loader.load(october);
  assert.deepEqual(requests, [0, 1, 1]);
  assert.deepEqual(recovered.records.map(record => record.id), ['event-0', 'event-1']);
  assert.equal(clock.pending, 0);
});

test('an aborted pagination attempt preserves earlier pages and ignores the late aborted page', async () => {
  const clock = fakeClock();
  const requests = [];
  const latePage = deferred();
  let waitOnce = true;
  const loader = createFeedPageLoader(async (_name, args) => {
    requests.push(args.page);
    if (args.page === 1 && waitOnce) { waitOnce = false; return latePage.promise; }
    return page(args.page, 1);
  }, clock);
  const controller = new AbortController();
  const failed = assert.rejects(loader.load(october, controller.signal), error => error.name === 'AbortError');
  await settle();
  controller.abort();
  await failed;
  const recovered = await loader.load(october);
  latePage.resolve({ ...page(1), records: [{ id: 'late-aborted-event' }] });
  await settle();
  assert.deepEqual(requests, [0, 1, 1]);
  assert.deepEqual(recovered.records.map(record => record.id), ['event-0', 'event-1']);
  assert.equal(clock.pending, 0);
});

test('a feed that fails while applying its response is not cached as a successful sync', async () => {
  const clock = fakeClock();
  const failure = new Error('record normalization failed');
  const errors = [];
  const applied = [];
  let requests = 0;
  let failOnce = true;
  const sync = createFeedSync({
    ...clock,
    load: async () => ({ records: [{ id: ++requests }] }),
    onSuccess(feed) {
      if (failOnce) { failOnce = false; throw failure; }
      applied.push(feed);
    },
    onError: error => errors.push(error),
  });

  assert.equal((await sync.sync(october)).error, failure);
  assert.deepEqual(errors, [failure]);
  assert.equal(applied.length, 0);
  const recovered = await sync.sync(october);
  assert.equal(requests, 2, 'a failed application must allow another fetch within the success interval');
  assert.equal(recovered.feed.records[0].id, 2);
  assert.equal(applied.length, 1);
  assert.equal((await sync.sync(october)).skipped, true);
  assert.equal(requests, 2, 'only the successfully applied response should receive the success interval');
});

test('failure applying a cached month returns an error asynchronously and permits a fresh load', async () => {
  const clock = fakeClock();
  const failure = new Error('cached records could not be applied');
  const errors = [];
  const applied = [];
  let requests = 0;
  let failCachedOnce = true;
  const sync = createFeedSync({
    ...clock,
    load: async args => ({ records: [{ id: `${args.start}:${++requests}` }] }),
    onSuccess(feed, metadata) {
      if (metadata.cached && failCachedOnce) { failCachedOnce = false; throw failure; }
      applied.push({ feed, cached: metadata.cached });
    },
    onError: error => errors.push(error),
  });
  await sync.sync(october);
  await sync.sync(november);
  let cachedRun;
  assert.doesNotThrow(() => { cachedRun = sync.sync(october); }, 'UI event handlers must not receive a synchronous throw from cached results');
  assert.equal(typeof cachedRun.then, 'function');
  assert.equal((await cachedRun).error, failure);
  assert.deepEqual(errors, [failure]);
  assert.equal(requests, 2);
  assert.equal(applied.length, 2);

  const recovered = await sync.sync(october);
  assert.equal(requests, 3, 'a rejected cached month must be invalidated before the next sync');
  assert.equal(recovered.feed.records[0].id, `${october.start}:3`);
  assert.equal(applied.length, 3);
  assert.equal(applied[2].cached, false);
});
