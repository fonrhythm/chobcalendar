import { validDate } from './dates.js'
export function safeUrl(v) {
  try {
    const u = new URL(String(v))
    return ['https:', 'http:'].includes(u.protocol) ? u.href : ''
  } catch {
    return ''
  }
}
function list(v) {
  if (Array.isArray(v)) return v.map(String)
  if (!v) return []
  try {
    const a = JSON.parse(v)
    if (Array.isArray(a)) return a.map(String)
  } catch {}
  return String(v)
    .split(/\r?\n|\||;(?=\s*https?:)|,(?=\s*https?:)/)
    .map((s) => s.trim())
    .filter(Boolean)
}
export function imageUrls(value) {
  return [...new Set(list(value).map(safeUrl).filter(Boolean))].slice(0, 9)
}
export function normalizeRecord(raw, index = 0, source = 'sheet') {
  const date = String(raw.date || raw.start_date || '').slice(0, 10),
    end = String(raw.end_date || '').slice(0, 10),
    name = String(raw.name || '').trim()
  if (!validDate(date)) throw new Error(`Row ${index + 1}: invalid date`)
  if (end && (!validDate(end) || end < date)) throw new Error(`Row ${index + 1}: invalid end_date`)
  if (!name) throw new Error(`Row ${index + 1}: missing name`)
  const map = {
    thai: 'thailand',
    thailand: 'thailand',
    china: 'china',
    oversea: 'oversea',
    overseas: 'oversea',
    泰国: 'thailand',
    中国: 'china',
    海外: 'oversea',
  }
  const region =
    map[
      String(raw.region || '')
        .trim()
        .toLowerCase()
    ]
  if (!region) throw new Error(`Row ${index + 1}: invalid region`)
  const cats = ['bl', 'gl', 'band', 'singer', 'group', 'actor', 'music', 'other'],
    category = cats.includes(String(raw.category).toLowerCase())
      ? String(raw.category).toLowerCase()
      : 'other'
  return {
    id: `${source}:${String(raw.id || `${region}-${date}-${index}`)}`,
    kind: raw.kind === 'task' ? 'task' : 'event',
    name,
    region,
    category,
    date,
    end_date: end,
    activity: String(raw.activity || raw.title || ''),
    activity_type: String(raw.activity_type || 'other'),
    time: String(raw.time || raw.start_time || ''),
    end_time: String(raw.end_time || ''),
    time_status: ['private', 'tba', 'all_day'].includes(raw.time_status) ? raw.time_status : '',
    venue: String(raw.venue || ''),
    city: String(raw.city || ''),
    type: String(raw.type || ''),
    company: String(raw.company || ''),
    note: String(raw.note || raw.description || ''),
    contact: String(raw.contact || raw.contact_info || ''),
    contact_method: String(raw.contact_method || ''),
    link: safeUrl(raw.link || raw.ticket_url),
    images: imageUrls(raw.images || raw.image_url || raw.picture_url || raw.picture_urls),
    isofficial:
      raw.isofficial === true ||
      raw.isofficial === 1 ||
      String(raw.isofficial).toLowerCase() === 'true',
  }
}
