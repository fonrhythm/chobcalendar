import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeTickerNotices } from '../src/utils/noticeTicker.js';

test('postponement rotates through its original date, then remains only in cards until a new date is set', () => {
  const records = [{ id: 'supabase:old', kind: 'event', date: '2026-09-29', end_date: '', postponed_to_date: '' }];
  const notices = [
    { id: 'postponed', event_id: 'old' },
    { id: 'unlinked', event_id: null },
  ];
  assert.deepEqual(activeTickerNotices(notices, records, '2026-09-29').map((n) => n.id), ['postponed', 'unlinked']);
  assert.deepEqual(activeTickerNotices(notices, records, '2026-09-30').map((n) => n.id), ['unlinked']);
  records[0].postponed_to_date = '2026-10-04';
  assert.deepEqual(activeTickerNotices(notices, records, '2026-10-01').map((n) => n.id), ['postponed', 'unlinked']);
});
