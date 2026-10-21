import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  completionLabel,
  eventCompletion,
  isPendingItem,
  taskCompletion,
} from '../src/utils/taskCompletion.js';

const instant = value => Date.parse(value);
const at = '2026-11-12T17:00:00.000Z'; // Midnight after November 12 in Bangkok.
const before = instant(at) - 1;
const boundary = instant(at);
const plain = value => JSON.parse(JSON.stringify(value));
const ticket = overrides => ({
  id: 'ticket', kind: 'task', task_type: 'ticketing',
  date: '2026-10-01', time: '10:00', ...overrides,
});

test('manual sold-out and result states close immediately with their distinct labels', () => {
  for (const [reason, label] of [
    ['sold_out', '已售罄'], ['results_published', '已出名单'], ['ended', '已结束'],
  ]) {
    const state = taskCompletion(ticket({
      is_closed: true, closure_reason: reason, end_date: '2030-01-01',
    }), null, instant('2026-11-01T00:00:00Z'));
    assert.deepEqual(state, { closed: true, reason, at: null });
    assert.equal(completionLabel(state), label);
    assert.equal(completionLabel(reason), label);
  }
});

test('server closure snapshots retain automatic reasons and old snapshots get a safe label', () => {
  for (const [reason, label] of [
    ['event_ended', '活动已结束'], ['task_ended', '已截止'], ['event_cancelled', '活动已取消'],
  ]) {
    const state = taskCompletion(ticket({ is_closed: true, closure_reason: reason }), null, before);
    assert.deepEqual(state, { closed: true, reason, at: null });
    assert.equal(completionLabel(state), label);
  }
  for (const closure_reason of [undefined, '', 'unexpected']) {
    assert.deepEqual(taskCompletion(ticket({ is_closed: true, closure_reason }), null, before), {
      closed: true, reason: 'sold_out', at: null,
    });
  }
  assert.equal(completionLabel({ closed: false, reason: '' }), '');
});

test('an out-of-window parent can close a ticket using the server deadline snapshot', () => {
  const record = ticket({ auto_close_at: at, auto_close_reason: 'event_ended' });
  assert.deepEqual(taskCompletion(record, null, before), { closed: false, reason: '', at });
  assert.deepEqual(taskCompletion(record, null, boundary), {
    closed: true, reason: 'event_ended', at,
  });
  assert.equal(isPendingItem(record, [record], before), true);
  assert.equal(isPendingItem(record, [record], boundary), false);
});

test('a cached task becomes closed as the clock advances without replacing the cached object', () => {
  const cached = Object.freeze(ticket({
    auto_close_at: '2026-11-12T14:30:00+07:00', auto_close_reason: 'task_ended',
  }));
  const deadline = instant('2026-11-12T07:30:00Z');
  assert.deepEqual(taskCompletion(cached, null, deadline - 1), {
    closed: false, reason: '', at: '2026-11-12T07:30:00.000Z',
  });
  assert.deepEqual(taskCompletion(cached, null, deadline), {
    closed: true, reason: 'task_ended', at: '2026-11-12T07:30:00.000Z',
  });
  assert.equal(cached.is_closed, undefined);
});

test('tickets without their own deadline stay open after sale starts and close with their parent', () => {
  const record = ticket();
  assert.equal(taskCompletion(record, null, boundary).closed, false);
  const parent = {
    id: 'event', kind: 'event', date: '2026-11-10',
    attributes: { end_date: '2026-11-12', end_time: '06:00' },
  };
  assert.deepEqual(taskCompletion(record, parent, before), { closed: false, reason: '', at });
  assert.deepEqual(taskCompletion(record, parent, boundary), {
    closed: true, reason: 'event_ended', at,
  });
});

test('multi-day events finish at the final Bangkok day boundary and ignore event time fields', () => {
  const event = {
    id: 'event', kind: 'event', date: '2026-11-10', end_date: '2026-11-12',
    time: '09:00', start_time: '09:00', end_time: '10:00',
  };
  assert.deepEqual(eventCompletion(event, before), { closed: false, reason: '', at });
  assert.deepEqual(eventCompletion(event, boundary), { closed: true, reason: 'event_ended', at });
  assert.equal(eventCompletion(event, instant('2026-11-10T23:59:59+07:00')).closed, false);
  const oneDay = { ...event, date: '2026-11-12', end_date: '' };
  assert.equal(eventCompletion(oneDay, instant('2026-11-12T10:01:00+07:00')).closed, false);
  assert.equal(eventCompletion(oneDay, boundary).closed, true);
});

test('a postponed event without a new date does not close from the old date or parent snapshot', () => {
  for (const parent of [
    { date: '2026-10-01', end_date: '2026-10-02', event_status: 'postponed' },
    { date: '2026-10-01', attributes: { end_date: '2026-10-02', event_status: 'postponed' } },
  ]) {
    assert.deepEqual(eventCompletion(parent, boundary), { closed: false, reason: '', at: null });
    assert.deepEqual(taskCompletion(ticket({
      auto_close_at: '2026-10-02T17:00:00Z', auto_close_reason: 'event_ended',
    }), parent, boundary), { closed: false, reason: '', at: null });
  }
});

test('a confirmed postponement uses the new date rather than the original event date', () => {
  for (const parent of [
    { date: '2026-10-01', event_status: 'postponed', postponed_to_date: '2026-11-12' },
    { date: '2026-10-01', attributes: { event_status: 'postponed', postponed_to_date: '2026-11-12' } },
  ]) {
    assert.deepEqual(eventCompletion(parent, before), { closed: false, reason: '', at });
    assert.deepEqual(eventCompletion(parent, boundary), { closed: true, reason: 'event_ended', at });
    assert.deepEqual(taskCompletion(ticket(), parent, boundary), {
      closed: true, reason: 'event_ended', at,
    });
  }
});

test('cancellation closes the event and associated tasks immediately even for future dates', () => {
  for (const parent of [
    { date: '2030-01-01', event_status: 'cancelled' },
    { date: '2030-01-01', attributes: { event_status: 'cancelled' } },
    { date: '2030-01-01', cancelled_at: '2026-11-01T00:00:00Z' },
  ]) {
    const state = { closed: true, reason: 'event_cancelled', at: null };
    assert.deepEqual(eventCompletion(parent, before), state);
    assert.deepEqual(taskCompletion(ticket(), parent, before), state);
  }
});

test('an explicit task cutoff takes precedence over a later parent deadline', () => {
  const record = ticket({ end_date: '2026-11-11', end_time: '14:30' });
  const parent = { date: '2026-11-12' };
  const cutoff = instant('2026-11-11T07:30:00Z');
  const expectedAt = '2026-11-11T07:30:00.000Z';
  assert.deepEqual(taskCompletion(record, parent, cutoff - 1), {
    closed: false, reason: '', at: expectedAt,
  });
  assert.deepEqual(taskCompletion(record, parent, cutoff), {
    closed: true, reason: 'task_ended', at: expectedAt,
  });
  assert.equal(taskCompletion(record, { ...parent, event_status: 'postponed' }, cutoff).closed, true);
  assert.equal(taskCompletion(ticket({ end_date: '2026-11-20' }), parent, boundary).reason, 'event_ended');
});
test('pending dates ignore old dates while invalid multi-day ends fall back to the real event date', () => {
  const event = { date: '2026-11-12', field_states: { date: 'tba' } };
  assert.equal(eventCompletion(event, boundary).closed, false);
  assert.equal(taskCompletion(ticket({ auto_close_at: at, auto_close_reason: 'event_ended' }), event, boundary).closed, false);
  for (const end_date of ['bad', '2026-02-30', '2026-11-10']) assert.equal(eventCompletion({ date: '2026-11-12', end_date }, boundary).closed, true);
});

test('raw task dates and normalized task dates share the same Bangkok day-end fallback', () => {
  const raw = { kind: 'task', task_type: 'registration', start_date: '2026-11-12', start_time: '08:00' };
  const normalized = { kind: 'task', task_type: 'registration', date: '2026-11-12', time: '08:00' };
  for (const now of [instant('2026-11-12T08:01:00+07:00'), before, boundary]) {
    assert.deepEqual(taskCompletion(raw, null, now), taskCompletion(normalized, null, now));
  }
  assert.deepEqual(taskCompletion(raw, null, before), { closed: false, reason: '', at });
  assert.deepEqual(taskCompletion(raw, null, boundary), { closed: true, reason: 'task_ended', at });
});

test('pending filtering hides closed items without altering calendar, history or favorite records', () => {
  const records = [
    { id: 'event', kind: 'event', date: '2026-11-12' },
    ticket({ id: 'ticket', event_id: 'event' }),
    { id: 'future', kind: 'event', date: '2026-11-20' },
    ticket({ id: 'sold', is_closed: true, closure_reason: 'sold_out' }),
  ];
  const favoriteIds = Object.freeze(['event', 'ticket', 'sold']);
  const historyIds = Object.freeze(['event', 'ticket']);
  const snapshot = plain(records);
  records.forEach(Object.freeze);
  Object.freeze(records);
  assert.deepEqual(records.filter(row => isPendingItem(row, records, before)).map(row => row.id), [
    'event', 'ticket', 'future',
  ]);
  assert.deepEqual(records.filter(row => isPendingItem(row, records, boundary)).map(row => row.id), ['future']);
  assert.deepEqual(records, snapshot);
  assert.deepEqual([...favoriteIds], ['event', 'ticket', 'sold']);
  assert.deepEqual([...historyIds], ['event', 'ticket']);
});

test('the mini-program and web agree for raw, normalized, cached and exceptional records', () => {
  const context = { module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(new URL('../miniprogram/client/shared/taskCompletion.js', import.meta.url), 'utf8'), context);
  const mini = context.module.exports;
  const parents = [
    null,
    { id: 'event', kind: 'event', date: '2026-11-12', time: '08:00' },
    { id: 'event', kind: 'event', date: '2026-11-10', attributes: { end_date: '2026-11-12' } },
    { id: 'event', kind: 'event', date: '2026-10-01', event_status: 'postponed' },
    { id: 'event', kind: 'event', date: '2026-10-01', event_status: 'postponed', postponed_to_date: '2026-11-12' },
    { id: 'event', kind: 'event', date: '2030-01-01', event_status: 'cancelled' },
  ];
  const tasks = [
    ticket({ event_id: 'event' }),
    ticket({ event_id: 'event', end_date: '2026-11-12', end_time: '14:30' }),
    { id: 'raw', kind: 'task', task_type: 'registration', start_date: '2026-11-12', start_time: '08:00' },
    ticket({ auto_close_at: at, auto_close_reason: 'event_ended' }),
    ticket({ is_closed: true, closure_reason: 'results_published' }),
  ];
  for (const now of [before, boundary]) {
    for (const parent of parents) {
      assert.deepEqual(plain(mini.eventCompletion(parent, now)), eventCompletion(parent, now));
      for (const record of tasks) {
        const expected = taskCompletion(record, parent, now);
        assert.deepEqual(plain(mini.taskCompletion(record, parent, now)), expected);
        assert.equal(mini.completionLabel(expected), completionLabel(expected));
        const records = parent ? [parent, record] : [record];
        assert.equal(mini.isPendingItem(record, records, now), isPendingItem(record, records, now));
      }
    }
  }
});
