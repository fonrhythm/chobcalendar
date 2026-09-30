import { activityCategory } from '../utils/activityTypes';
import { call, useSupabaseFeed, demoMode } from '../api/supabase';
import { normalizeRecord } from '../utils/records';
import { eventDisplayName } from '../utils/cpDisplayName';
import { useAccountStore } from './account';
import { dateKey } from '../utils/dates';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { endpoint, fetchRecords } from '../api/appsScriptService';
import { demoRecords } from '../data/demo';
import { useViewStore } from './view';
import { occursOn, intersectsMonth } from '../utils/dates';
import { sourceRule } from '../utils/sources';
export const useEventsStore = defineStore('events', () => {
  const artistCatalog = ref([]),
    typeCatalog = ref([]),
    conditionCatalog = ref([]),
    announcements = ref([]),
    personalError = ref(''),
    updates = ref([]);
  let previousVersions = {};
  try {
    previousVersions = JSON.parse(
      localStorage.getItem('chob-seen-versions') || '{}',
    );
  } catch {}
  const sourceKey = useSupabaseFeed ? 'supabase' : endpoint;
  const records = ref([]),
    status = ref('idle'),
    error = ref(''),
    updatedAt = ref(''),
    preview = ref(false),
    favorites = ref([]),
    myItems = ref([]),
    favoriteArtists = ref([]);
  for (const [key, target] of [
    ['chob-my-items', myItems],
    ['chob-favorite-artists', favoriteArtists],
  ]) {
    try {
      const values = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(values))
        target.value = values.filter((v) => typeof v === 'string');
    } catch {}
  }
  try {
    const f = JSON.parse(localStorage.getItem('chob-favorites-v2') || '[]');
    if (Array.isArray(f))
      favorites.value = f.filter((x) => typeof x === 'string');
  } catch {}
  const view = useViewStore(),
    inRegion = computed(() =>
      records.value.filter((r) => r.region === view.currentRegion),
    );
  const companies = computed(() =>
    [...new Set(inRegion.value.map((r) => r.company).filter(Boolean))].sort(),
  );
  const filtered = computed(() =>
    inRegion.value.filter((r) => {
      const q = view.query.trim().toLowerCase();
      return (
        (!view.companies.length || view.companies.includes(r.company)) &&
        (!view.categories.length || view.categories.includes(r.category)) &&
        (!view.activityTypes.length ||
          view.activityTypes.includes(
            activityCategory(
              r.activity_type !== 'other' ? r.activity_type : r.type,
            ),
          )) &&
        (!view.onlyFavorites ||
          favorites.value.includes(r.id) ||
          r.artist_ids?.some((id) => favoriteArtists.value.includes(id)) ||
          artistCatalog.value.some(
            (a) =>
              a.member_ids?.length &&
              favoriteArtists.value.includes(a.id) &&
              a.member_ids.every((id) => r.artist_ids?.includes(id)),
          ) ||
          favoriteArtists.value.includes('name:' + r.name)) &&
        (!q ||
          [r.name, r.activity, r.venue, r.city, r.company, r.note]
            .join(' ')
            .toLowerCase()
            .includes(q))
      );
    }),
  );
  const events = computed(() =>
      filtered.value.filter((r) => r.kind === 'event'),
    ),
    tasks = computed(() => filtered.value.filter((r) => r.kind === 'task'));
  const monthEvents = computed(() =>
    events.value.filter((r) => intersectsMonth(r, view.month)),
  );
  function onDate(day, kind = 'event') {
    return (kind === 'task' ? tasks.value : events.value)
      .filter((r) => occursOn(r, day))
      .sort(
        (a, b) =>
          (a.time || '99').localeCompare(b.time || '99') ||
          a.name.localeCompare(b.name),
      );
  }
  async function toggleFavorite(id) {
    const before = [...favorites.value];
    personalError.value = '';
    favorites.value = favorites.value.includes(id)
      ? favorites.value.filter((x) => x !== id)
      : [...favorites.value, id];
    try {
      await useAccountStore().save();
    } catch (e) {
      favorites.value = before;
      personalError.value = e.message;
      return;
    }
    try {
      if (!useAccountStore().user)
        localStorage.setItem(
          'chob-favorites-v2',
          JSON.stringify(favorites.value),
        );
    } catch {}
  }
  async function toggleMyItem(id) {
    const before = [...myItems.value];
    personalError.value = '';
    if (!records.value.some((r) => r.id === id)) return;
    myItems.value = myItems.value.includes(id)
      ? myItems.value.filter((x) => x !== id)
      : [...myItems.value, id];
    try {
      await useAccountStore().save();
    } catch (e) {
      myItems.value = before;
      personalError.value = e.message;
      return;
    }
    try {
      if (!useAccountStore().user)
        localStorage.setItem('chob-my-items', JSON.stringify(myItems.value));
    } catch {}
  }
  async function toggleArtist(id) {
    const before = [...favoriteArtists.value];
    personalError.value = '';
    favoriteArtists.value = favoriteArtists.value.includes(id)
      ? favoriteArtists.value.filter((x) => x !== id)
      : [...favoriteArtists.value, id];
    try {
      await useAccountStore().save();
    } catch (e) {
      favoriteArtists.value = before;
      personalError.value = e.message;
      return;
    }
    try {
      if (!useAccountStore().user)
        localStorage.setItem(
          'chob-favorite-artists',
          JSON.stringify(favoriteArtists.value),
        );
    } catch {}
  }
  function showDemo() {
    records.value = demoRecords();
    artistCatalog.value = [
      {
        id: 'demo-a',
        name: '演示艺人 A',
        company: '演示公司',
        categories: ['演员'],
      },
      {
        id: 'demo-b',
        name: '演示艺人 B',
        company: '演示公司',
        categories: ['演员', '歌手'],
      },
    ];
    artistCatalog.value.push(
      {
        id: 'cp:demo-pair',
        name: '演示 CP',
        categories: ['CP'],
        member_ids: ['demo-a', 'demo-b'],
      },
      {
        id: 'demo-group',
        name: '演示组合',
        categories: ['group'],
        group_kind: 'group',
        group_member_ids: ['demo-a', 'demo-b'],
      },
      {
        id: 'demo-band',
        name: '演示乐队',
        categories: ['band'],
        group_kind: 'band',
      },
    );
    announcements.value = [
      {
        id: 'demo-notice',
        title: '演示消息 · 活动延期',
        body: '原定今日的演示活动延期至七天后。可点击原日期和新日期，查看关联说明。本条消息仅供样式预览。',
        source_url: 'https://example.com/',
        event_id: null,
      },
    ];
    conditionCatalog.value = [
      { code: 'unrestricted', name: '无限制' },
      { code: 'ticket', name: '购票' },
      { code: 'shopping', name: '购物名额' },
      { code: 'top_spender_lucky_fans', name: 'Top Spender/Lucky Fans' },
      { code: 'registration', name: '填报' },
    ];
    myItems.value = records.value
      .filter((r) => r.kind === 'event' && r.date === dateKey(new Date()))
      .filter((r, i) => i % 4 === 3)
      .map((r) => r.id);
    updates.value = records.value
      .filter((r) => r.kind === 'event' && r.roll_call)
      .map((r) => r.id);
    preview.value = true;
    status.value = 'demo';
    error.value = '';
    view.resetFilters();
    view.today();
  }
  let inFlight = false;
  async function sync() {
    if (demoMode) {
      showDemo();
      return;
    }
    if (inFlight) return;
    if (!sourceKey) {
      if (!preview.value) status.value = 'unconfigured';
      return;
    }
    inFlight = true;
    status.value = 'loading';
    error.value = '';
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 60000);
    try {
      let incoming;
      if (useSupabaseFeed) {
        const feed = await call('chob_public_feed', {}, controller.signal);
        incoming = feed.records.map((r, i) =>
          normalizeRecord(r, i, 'supabase'),
        );
        artistCatalog.value = feed.artists;
        incoming = incoming.map((event) => ({
          ...event,
          name: eventDisplayName(event, feed.artists),
        }));
        typeCatalog.value = feed.types;
        conditionCatalog.value = (feed.conditions || []).filter((condition) => !/仅(?:获得|限)资格者/.test(condition.name || ''));
        announcements.value = feed.announcements;
      } else incoming = await fetchRecords(controller.signal);
      const baseline = Object.keys(previousVersions).length > 0;
      updates.value = incoming
        .filter(
          (r) =>
            r.kind === 'event' &&
            (r.end_date || r.date) >= dateKey(new Date()) &&
            baseline &&
            previousVersions[r.id] !== version(r),
        )
        .map((r) => r.id);
      records.value = incoming;
      for (const r of incoming)
        if (!updates.value.includes(r.id)) previousVersions[r.id] = version(r);
      persistSeen();
      preview.value = false;
      updatedAt.value = new Date().toISOString();
      status.value = 'synced';
      try {
        localStorage.setItem(
          'chob-cache-v2',
          JSON.stringify({
            endpoint: sourceKey,
            records: records.value,
            updatedAt: updatedAt.value,
          }),
        );
      } catch {}
    } catch (e) {
      error.value =
        e.name === 'AbortError'
          ? '读取超时，请稍后重试。'
          : String(e.message || '读取失败。');
      status.value = preview.value
        ? 'demo-error'
        : records.value.length
          ? 'stale'
          : 'error';
    } finally {
      clearTimeout(timeout);
      inFlight = false;
    }
  }
  function version(r) {
    return (
      r.updated_at ||
      JSON.stringify([
        r.name,
        r.activity,
        r.date,
        r.time,
        r.venue,
        r.city,
        r.note,
        r.images,
        r.event_status,
      ])
    );
  }
  function persistSeen() {
    try {
      localStorage.setItem(
        'chob-seen-versions',
        JSON.stringify(previousVersions),
      );
    } catch {}
  }
  function markDateRead(day) {
    for (const r of onDate(day)) {
      previousVersions[r.id] = version(r);
      updates.value = updates.value.filter((id) => id !== r.id);
    }
    persistSeen();
  }
  function initialize() {
    if (demoMode) {
      showDemo();
      return;
    }
    if (sourceKey)
      try {
        const c = JSON.parse(localStorage.getItem('chob-cache-v2') || 'null');
        if (
          c?.endpoint === sourceKey &&
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
            const rule = sourceRule(record.id);
            return rule
              ? {
                  ...record,
                  region: rule[1] || record.region,
                  isofficial: rule[2],
                }
              : record;
          });
          updatedAt.value = c.updatedAt;
          status.value = 'stale';
        }
      } catch {}
    sync();
  }
  return {
    artistCatalog,
    typeCatalog,
    conditionCatalog,
    announcements,
    personalError,
    updates,
    markDateRead,
    records,
    status,
    error,
    updatedAt,
    preview,
    favorites,
    myItems,
    favoriteArtists,
    toggleMyItem,
    toggleArtist,
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
  };
});

