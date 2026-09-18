import test from 'node:test'
import assert from 'node:assert/strict'
import { visibleEventCount, calendarAction, attendance } from '../src/utils/calendarDisplay.js'
test('mobile overflow begins at four; all visible labels open their day when overflowing', () => {
  for (const [total, count, action] of [[1,1,'open'],[2,2,'open'],[3,3,'open'],[4,2,'day'],[5,2,'day'],[27,2,'day']]) {
    assert.equal(visibleEventCount(total,true),count)
    assert.equal(calendarAction(total,true),action)
  }
  assert.equal(visibleEventCount(4,false),3)
  assert.equal(calendarAction(4,false),'day')
  assert.equal(calendarAction(3,false),'open')
})
test('attendance uses city text, retaining blank cities only in all', () => {
  assert.equal(attendance('线上直播'),'online')
  assert.equal(attendance('TikTok 线上直播'),'online')
  assert.equal(attendance('曼谷'),'offline')
  assert.equal(attendance('  '),'')
  assert.equal(attendance(undefined),'')
})
