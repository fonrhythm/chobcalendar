import { normalizeRecord } from '../utils/records'
export const endpoint = import.meta.env.VITE_APPS_SCRIPT_URL || ''
// Public read-only API. Authentication secrets must never be embedded in frontend code.
export async function fetchRecords(signal) {
  const url = new URL(endpoint)
  if (url.protocol !== 'https:') throw new Error('HTTPS endpoint required')
  const res = await fetch(url.href, { signal, redirect: 'follow' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const body = await res.json()
  if (body.success === false) throw new Error('Data source unavailable')
  const rows = Array.isArray(body) ? body : body.data
  if (!Array.isArray(rows)) throw new Error('Expected array in data')
  const records = rows.map((r, i) => normalizeRecord(r, i))
  if (new Set(records.map((r) => r.id)).size !== records.length)
    throw new Error('Duplicate record IDs')
  return records
}
