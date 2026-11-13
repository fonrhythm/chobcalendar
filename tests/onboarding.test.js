import test from 'node:test'
import assert from 'node:assert/strict'
import { tours } from '../src/onboarding/config.js'
import {
  readTourState,
  finishTour,
  learnTourStep,
  selectTourSteps,
  shouldOfferTour,
  writeTourState,
} from '../src/onboarding/state.js'
const empty = () => readTourState({ getItem: () => null })
test('Schedule and Drama track completion independently and replay never erases completed knowledge', () => {
  const original = empty()
  const schedule = finishTour(original, 'schedule', 'completed')
  assert.equal(schedule.modules.drama, undefined)
  assert.equal(original.modules.schedule, undefined)
  const drama = finishTour(schedule, 'drama', 'skipped')
  assert.equal(drama.modules.schedule.status, 'completed')
  assert.equal(drama.modules.drama.status, 'skipped')
  assert.equal(finishTour(drama, 'schedule', 'skipped').modules.schedule.status, 'completed')
})
test('shared topics can be skipped while module-specific guidance remains', () => {
  let state = empty()
  for (const key of ['basics', 'calendar', 'account', 'contribute'])
    state = learnTourStep(state, key)
  assert.equal(state.learned.length, 4)
  assert.equal(learnTourStep(state, 'account'), state)
  const steps = selectTourSteps(tours.drama, state, true)
  assert.deepEqual(
    steps.map((s) => s.id),
    ['chips', 'library', 'other'],
  )
  assert.equal(selectTourSteps(tours.drama, state, false).length, 7)
})
test('first calendar entry offers a tour; deep links and completed/skipped modules do not', () => {
  const state = empty()
  assert.equal(shouldOfferTour('https://x/?dramaSource=cloud#drama', 'drama', state), true)
  for (const url of [
    'https://x/#home',
    'https://x/?eventId=123#schedule',
    'https://x/?dramaId=123#drama',
    'https://x/#drama/123',
  ])
    assert.equal(shouldOfferTour(url, 'drama', state), false)
  assert.equal(
    shouldOfferTour('https://x/#schedule', 'schedule', finishTour(state, 'schedule', 'skipped')),
    false,
  )
})
test('corrupt or blocked storage does not break the guide and configuration covers all required steps and languages', () => {
  assert.deepEqual(
    readTourState({
      getItem() {
        throw Error('blocked')
      },
    }),
    empty(),
  )
  assert.equal(
    writeTourState(
      {
        setItem() {
          throw Error('blocked')
        },
      },
      empty(),
    ),
    false,
  )
  assert.equal(tours.schedule.length, 6)
  assert.equal(tours.drama.length, 7)
  for (const steps of Object.values(tours))
    for (const step of steps)
      for (const lang of ['zh', 'en', 'th']) {
        assert.ok(step.title[lang])
        assert.ok(step.body[lang])
      }
})
