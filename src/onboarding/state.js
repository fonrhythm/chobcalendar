export const TOUR_KEY = 'chob-onboarding-v5'
export function readTourState(storage) {
  try {
    const value = JSON.parse(storage.getItem(TOUR_KEY))
    if (value?.version === 1 && value.modules && Array.isArray(value.learned))
      return {
        version: 1,
        modules: Object.fromEntries(
          Object.entries(value.modules).filter(
            ([key, row]) =>
              ['schedule', 'drama'].includes(key) && ['completed', 'skipped'].includes(row?.status),
          ),
        ),
        learned: value.learned.filter((v) => typeof v === 'string'),
      }
  } catch {}
  return { version: 1, modules: {}, learned: [] }
}
export function finishTour(state, module, status, at = new Date().toISOString()) {
  if (!['schedule', 'drama'].includes(module) || !['completed', 'skipped'].includes(status))
    throw Error('Invalid tour status')
  return {
    ...state,
    modules: {
      ...state.modules,
      [module]: {
        status: state.modules[module]?.status === 'completed' ? 'completed' : status,
        at,
      },
    },
  }
}
export function learnTourStep(state, key) {
  return !key || state.learned.includes(key)
    ? state
    : { ...state, learned: [...state.learned, key] }
}
export function selectTourSteps(steps, state, skipCommon) {
  return steps.filter((step) => !skipCommon || !step.common || !state.learned.includes(step.common))
}
export function shouldOfferTour(url, module, state) {
  const u = new URL(url, 'https://calendar.invalid')
  if (state.modules[module]) return false
  if (
    [...u.searchParams.keys()].some((k) =>
      /^(id|event|eventId|drama|dramaId|episode|detail)$/i.test(k),
    )
  )
    return false
  return ['schedule', 'drama', 'china', 'thailand', 'oversea'].includes(u.hash.slice(1))
}
export function writeTourState(storage, state) {
  try {
    storage.setItem(TOUR_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
