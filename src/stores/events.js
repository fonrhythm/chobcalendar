import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { endpoint, fetchRecords } from '../api/appsScriptService'
import { demoRecords } from '../data/demo'
import { useViewStore } from './view'
import { occursOn, intersectsMonth } from '../utils/dates'
import { sourceRule } from '../utils/sources'
export const useEventsStore = defineStore('events', () => {
  const records = ref([]),
    status = ref('idle'),
    error = ref(''),
    updatedAt = ref(''),
    preview = ref(false),
    favorites = ref([])
  try {
    const f = JSON.parse(localStorage.getItem('chob-favorites-v2') || '[]')
    if (Array.isArray(f)) favorites.value = f.filter((x) => typeof x === 'string')
  } catch {}
  const view = useViewStore(),
    inRegion = computed(() => records.value.filter((r) => r.region === view.currentRegion))
  const companies = computed(() =>
    [...new Set(inRegion.value.map((r) => r.company).filter(Boolean))].sort(),
  )
  const filtered = computed(() =>
    inRegion.value.filter((r) => {
      const q = view.query.trim().toLowerCase()
      return (
        (!view.companies.length || view.companies.includes(r.company)) &&
        (!view.categories.length || view.categories.includes(r.category)) &&
        (!view.onlyFavorites || favorites.value.includes(r.id)) &&
        (!q ||
          [r.name, r.activity, r.venue, r.city, r.company, r.note]
            .join(' ')
            .toLowerCase()
            .includes(q))
      )
    }),
  )
  const events = computed(() => filtered.value.filter((r) => r.kind === 'event')),
    tasks = computed(() => filtered.value.filter((r) => r.kind === 'task'))
  const monthEvents = computed(() => events.value.filter((r) => intersectsMonth(r, view.month)))
  function onDate(day, kind = 'event') {
    return (kind === 'task' ? tasks.value : events.value)
      .filter((r) => occursOn(r, day))
      .sort(
        (a, b) => (a.time || '99').localeCompare(b.time || '99') || a.name.localeCompare(b.name),
      )
  }
  function toggleFavorite(id) {
    favorites.value = favorites.value.includes(id)
      ? favorites.value.filter((x) => x !== id)
      : [...favorites.value, id]
    try {
      localStorage.setItem('chob-favorites-v2', JSON.stringify(favorites.value))
    } catch {}
  }
  function showDemo() {
    records.value = demoRecords()
    preview.value = true
    status.value = 'demo'
    error.value = ''
    view.resetFilters()
    view.today()
  }
  let inFlight = false
  async function sync() {
    if (inFlight) return
    if (!endpoint) {
      if (!preview.value) status.value = 'unconfigured'
      return
    }
    inFlight = true
    status.value = 'loading'
    error.value = ''
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 60000)
    try {
      records.value = await fetchRecords(controller.signal)
      preview.value = false
      updatedAt.value = new Date().toISOString()
      status.value = 'synced'
      try {
        localStorage.setItem(
          'chob-cache-v2',
          JSON.stringify({ endpoint, records: records.value, updatedAt: updatedAt.value }),
        )
      } catch {}
    } catch (e) {
      error.value = e.name === 'AbortError' ? '读取超时，请稍后重试。' : String(e.message || '读取失败。')
      status.value = preview.value ? 'demo-error' : records.value.length ? 'stale' : 'error'
    } finally {
      clearTimeout(timeout)
      inFlight = false
    }
  }
  function initialize() {
    if (endpoint)
      try {
        const c = JSON.parse(localStorage.getItem('chob-cache-v2') || 'null')
        if (
          c?.endpoint === endpoint &&
          Array.isArray(c.records) &&
          c.records.every(
            (r) =>
              r &&
              typeof r.id === 'string' &&
              typeof r.date === 'string' &&
              typeof r.name === 'string',
          )
        ) {
          records.value = c.records.map((record) => {
            const rule = sourceRule(record.id)
            return rule ? { ...record, region: rule[1] || record.region, isofficial: rule[2] } : record
          })
          updatedAt.value = c.updatedAt
          status.value = 'stale'
        }
      } catch {}
    sync()
  }
  return {
    records,
    status,
    error,
    updatedAt,
    preview,
    favorites,
    companies,
    filtered,
    events,
    tasks,
    monthEvents,
    onDate,
    toggleFavorite,
    showDemo,
    sync,
    initialize,
  }
})
