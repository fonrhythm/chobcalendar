import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecord } from '../src/utils/records.js';
import { eventState, dateExplanation } from '../src/utils/eventState.js';
import { TASK_TYPES, taskCategory } from '../src/utils/tasks.js';
test('activity, artist and task classifications stay independent across normalization', () => {
  const r = normalizeRecord(
    {
      id: 'a',
      event_id: 'b',
      date: '2026-09-27',
      name: 'A / B',
      region: 'china',
      category: 'bl',
      kind: 'task',
      task_type: 'shopping',
      type: '见面会',
      artist_ids: ['a', 'b'],
      pending_fields: ['venue'],
    },
    0,
    'supabase',
  );
  assert.equal(r.event_id, 'supabase:b');
  assert.equal(r.task_type, 'shopping');
  assert.equal(r.category, 'bl');
  assert.equal(r.type, '见面会');
  assert.equal(eventState(r).pending, true);
  assert.deepEqual(
    TASK_TYPES.map((t) => t.label),
    ['开票', '填表', '消费', '其他'],
  );
  assert.equal(taskCategory('booking'), 'other');
  assert.equal(taskCategory('notification'), 'other');
});
test('pending flags coexist with cancelled/postponed states and dates remain linked', () => {
  assert.deepEqual(
    eventState({ event_status: 'cancelled', pending_fields: ['venue'] }),
    {
      cancelled: true,
      postponed: false,
      pending: true,
      faded: true,
      label: '已取消 · 内容待核实',
    },
  );
  assert.equal(eventState({ event_status: 'postponed' }).faded, true);
  assert.equal(
    dateExplanation({ date: '2026-09-27', postponed_to_date: '2026-10-02' }),
    '延期至 2026-10-02',
  );
  assert.equal(
    dateExplanation({ date: '2026-10-02', original_date: '2026-09-27' }),
    '原 2026-09-27 延期至 2026-10-02',
  );
});

import { artistTypes, selectionCount } from '../src/utils/artistSelection.js';
test('artist attributes deduplicate aliases and each selected CP/group counts once', () => {
  assert.deepEqual(
    artistTypes(['group', '组合', 'SINGER', '歌手', 'CP', 'cp']),
    ['组合', '歌手', 'CP'],
  );
  assert.equal(
    selectionCount({
      artist_selections: ['cp:a', 'group:b', 'band:c'],
      artist_ids: Array.from({ length: 12 }, (_, i) => String(i)),
    }),
    3,
  );
  assert.equal(
    selectionCount({ artist_selections: ['a', 'b', 'c', 'd', 'e', 'f'] }),
    6,
  );
  assert.equal(
    selectionCount({ artist_selections: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
    7,
  );
});
