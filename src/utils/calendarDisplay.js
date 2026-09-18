export function visibleEventCount(total, mobile) {
  return mobile && total >= 4 ? 2 : Math.min(total, 3)
}
export function calendarAction(total, mobile) {
  return total > visibleEventCount(total, mobile) ? 'day' : 'open'
}
export function attendance(city) {
  const value = String(city || '').trim()
  return !value ? '' : value.includes('线上直播') ? 'online' : 'offline'
}
