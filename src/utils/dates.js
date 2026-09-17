export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function parseDate(v) {
  const [y, m, d] = v.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export function validDate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && dateKey(parseDate(v)) === v
}
export function addDays(v, n) {
  const d = parseDate(v)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}
export function occursOn(r, d) {
  return r.date <= d && (r.end_date || r.date) >= d
}
export function intersectsMonth(r, m) {
  const start = m + '-01',
    d = parseDate(start)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return r.date <= dateKey(d) && (r.end_date || r.date) >= start
}
export function monthCells(m) {
  const first = m + '-01',
    d = parseDate(first),
    start = addDays(first, -d.getDay()),
    last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)
  return Array.from({ length: Math.ceil((d.getDay() + last.getDate()) / 7) * 7 }, (_, i) =>
    addDays(start, i),
  )
}
