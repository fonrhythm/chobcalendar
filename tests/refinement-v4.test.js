import test from 'node:test'
import assert from 'node:assert/strict'
import { timeRange, displayTime, attendance } from '../src/utils/calendarDisplay.js'
import { sources } from '../src/utils/sources.js'
import { normalizeRecord } from '../src/utils/records.js'
test('ranges split without conflating separate performances', () => {
  for (const separator of ['-', '–', '—', '~', '～', '至'])
    assert.deepEqual(timeRange(`10:00 ${separator} 21:00`), { start: '10:00', end: '21:00' })
  assert.deepEqual(timeRange('13:00 / 19:00\n总共两场'), {
    start: '13:00 / 19:00\n总共两场',
    end: '',
  })
  assert.deepEqual(timeRange('14:00', '16:00'), { start: '14:00', end: '16:00' })
})
test('time zones annotate without conversion, overseas text remains untouched', () => {
  assert.equal(displayTime('13:00', 'thailand'), '13:00 GMT+7')
  assert.equal(displayTime('13:00 GMT+8', 'china'), '13:00 GMT+8')
  assert.equal(displayTime('13:00 EST', 'oversea'), '13:00 EST')
  assert.equal(displayTime('', 'thailand'), '')
  assert.equal(attendance('线上直播'), 'online')
})
test('confirmed source mapping overrides stale official and single-region metadata', () => {
  for (const [id, region, official] of sources) {
    const row = normalizeRecord({
      id: id + ':0:A:event',
      name: 'A',
      date: '2026-09-19',
      region: 'china',
      isofficial: !official,
    })
    assert.equal(row.isofficial, official)
    assert.equal(row.region, region || 'china')
  }
  assert.equal(sources.filter((r) => r[2]).length, 4)
})
