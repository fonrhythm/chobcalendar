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

export function timeRange(time, end = '') {
  const text = String(time || '').trim()
  const match = text.match(/^(\d{1,2}[:：.]\d{2})\s*[-–—~～至]\s*(\d{1,2}[:：.]\d{2})$/)
  return { start: match ? match[1] : text, end: end || (match ? match[2] : '') }
}
export function displayTime(time, region) {
  const text = String(time || '').trim()
  if (!text || region === 'oversea') return text
  const zone = region === 'china' ? 'GMT+8' : 'GMT+7'
  return text.replace(/\s*GMT\s*[+]\s*[78]\s*$/i, '') + ' ' + zone
}
