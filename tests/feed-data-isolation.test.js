import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecord, normalizeFeedRecords } from '../src/utils/records.js';
const row = { id:'test', name:'Artist', region:'thailand', date:'2026-10-29' };
test('South Korea feed rows remain available in overseas without changing identity or dates', () => {
  for (const region of ['South Korea', ' 韩国 ', 'KR', 'เกาหลีใต้']) {
    const record = normalizeRecord({...row,region}, 0, 'supabase');
    assert.equal(record.region,'oversea');
    assert.equal(record.id,'supabase:test');
    assert.equal(record.date,row.date);
  }
  assert.throws(() => normalizeRecord({...row,region:'unknown'}), /invalid region/);
});
test('one malformed row cannot discard other valid events; diagnostics retain the row ID', () => {
  const result = normalizeFeedRecords([row,{...row,id:'bad',date:'2026-02-30'},{...row,id:'korea',region:'South Korea'}]);
  assert.equal(result.records.length,2);
  assert.equal(result.issues.length,1);
  assert.equal(result.issues[0].id,'bad');
  assert.match(result.issues[0].message,/invalid date/);
  assert.throws(()=>normalizeFeedRecords([{...row,region:'unknown'}]), {name:'FeedDataError'});
  assert.deepEqual(normalizeFeedRecords([]),{records:[],issues:[]});
});
