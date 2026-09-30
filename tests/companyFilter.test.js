import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companyOptions, matchesCompany } from '../src/utils/companyFilter.js';

test('company filter separates artist companies and matches each one', () => {
  const artists = [
    { id: 'a', company: 'Channel 3 / FRT Entertainment' },
    { id: 'b', company: 'frt entertainment / Dee Hup House' },
  ];
  const records = [
    { artist_ids: ['a'], company: 'stale combined event value' },
    { artist_ids: ['b'], company: 'stale event value' },
  ];
  assert.deepEqual(companyOptions(records, artists), ['Channel 3', 'Dee Hup House', 'FRT Entertainment']);
  assert.equal(matchesCompany(records[0], artists, ['FRT Entertainment']), true);
  assert.equal(matchesCompany(records[1], artists, ['Channel 3']), false);
  assert.equal(matchesCompany(records[0], artists, ['__none__']), false);
});
