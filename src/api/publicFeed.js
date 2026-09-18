import { normalizeRecord } from '../utils/records.js'
export async function readPublicFeed(endpoint, signal, fetcher = fetch) {
  const url = new URL(endpoint)
  if (url.protocol !== 'https:') throw new Error('HTTPS endpoint required')
  url.searchParams.set('action', 'publicFeed')
  const res = await fetcher(url.href, { signal, redirect: 'follow' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  let body
  try { body = await res.json() } catch { throw new Error('接口未返回 JSON，请检查 Apps Script 部署访问权限。') }
  if (body?.success === false) {
    if (body.error === 'KEY_MISMATCH') throw new Error('请先安装 PublicFeed.gs，并将 Apps Script 部署更新为新版本。')
    throw new Error(String(body.message || body.error || 'Data source unavailable'))
  }
  if (body?.version !== 'chob-public-v1' || !Array.isArray(body.data))
    throw new Error('接口版本不匹配，请更新 Apps Script 的 publicFeed 入口。')
  const records = body.data.map((r, i) => normalizeRecord(r, i))
  if (new Set(records.map(r => r.id)).size !== records.length) throw new Error('Duplicate record IDs')
  return records
}
