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

export function activityCategory(type) {
  const value = String(type || '')
    .trim()
    .toLowerCase()
  return (
    {
      站台活动: 'brand',
      站台活動: 'brand',
      剧集宣传: 'series',
      劇集宣傳: 'series',
      舞台演出: 'stage',
      brand: 'brand',
      series: 'series',
      stage: 'stage',
    }[value] || 'other'
  )
}
