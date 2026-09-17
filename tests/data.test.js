import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRecord, safeUrl } from '../src/utils/records.js'
import { occursOn, monthCells, addDays, intersectsMonth } from '../src/utils/dates.js'

test('Multi-day tasks include every day, including both endpoints', () => {
  const task = { date: '2026-09-28', end_date: '2026-10-03' }
  for (const day of [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
  ])
    assert.equal(occursOn(task, day), true)
  assert.equal(occursOn(task, '2026-09-27'), false)
  assert.equal(occursOn(task, '2026-10-04'), false)
  assert.equal(intersectsMonth(task, '2026-10'), true)
})
test('Calendar handles leap years and six-row months', () => {
  const cells = monthCells('2026-08')
  assert.equal(cells.length, 42)
  assert.equal(cells[0], '2026-07-26')
  assert.equal(cells.at(-1), '2026-09-05')
  assert.equal(addDays('2028-02-28', 1), '2028-02-29')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})
test('Normalization rejects impossible dates and reversed intervals', () => {
  const r = { id: 'a', name: 'Artist', region: 'thai', date: '2026-09-01' }
  assert.equal(normalizeRecord(r).region, 'thailand')
  assert.throws(() => normalizeRecord({ ...r, date: '2026-02-30' }))
  assert.throws(() => normalizeRecord({ ...r, end_date: '2026-08-31' }))
  assert.throws(() => normalizeRecord({ ...r, name: '' }))
  assert.throws(() => normalizeRecord({ ...r, region: 'unknown' }))
})
test('Official flags do not treat the string false as true', () => {
  const r = { id: 'a', name: 'Artist', region: 'china', date: '2026-09-01' }
  assert.equal(normalizeRecord({ ...r, isofficial: 'false' }).isofficial, false)
  assert.equal(normalizeRecord({ ...r, isofficial: 'TRUE' }).isofficial, true)
  assert.equal(normalizeRecord({ ...r, isofficial: false }).isofficial, false)
})
test('Non-http links and image sources are removed', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '')
  assert.equal(safeUrl('data:text/html,test'), '')
  const r = normalizeRecord({
    id: 'x',
    name: 'Artist',
    region: 'china',
    date: '2026-09-01',
    link: 'javascript:alert(1)',
    images: ['https://example.com/a.png', 'javascript:bad'],
  })
  assert.equal(r.link, '')
  assert.deepEqual(r.images, ['https://example.com/a.png'])
})
