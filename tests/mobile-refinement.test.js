import test from 'node:test'
import assert from 'node:assert/strict'
import { imageUrls, normalizeRecord } from '../src/utils/records.js'
import { activityCategory } from '../src/utils/calendarDisplay.js'
test('stats classify type independently of activity_type', () => {
  for (const [type, key] of [
    ['站台活动', 'brand'],
    ['剧集宣传', 'series'],
    ['舞台演出', 'stage'],
    ['未知', 'other'],
    ['', 'other'],
  ])
    assert.equal(activityCategory(type), key)
})
test('poster lists accept legacy aliases and separators and limit to nine valid images', () => {
  const urls = Array.from({ length: 11 }, (_, i) => `https://example.com/${i}.jpg`)
  assert.equal(imageUrls(urls).length, 9)
  assert.deepEqual(imageUrls(urls.slice(0, 2).join('\n')), urls.slice(0, 2))
  assert.deepEqual(imageUrls(urls.slice(0, 2).join(',')), urls.slice(0, 2))
  assert.deepEqual(imageUrls(JSON.stringify(urls.slice(0, 2))), urls.slice(0, 2))
  assert.deepEqual(imageUrls(['javascript:alert(1)', urls[0], urls[0]]), [urls[0]])
  assert.equal(
    normalizeRecord({ name: 'A', date: '2026-09-18', region: 'thailand', picture_url: urls[0] })
      .images[0],
    urls[0],
  )
})
