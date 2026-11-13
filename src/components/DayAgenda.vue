<script setup>
import { matchesScheduleRegion } from '../utils/scheduleRegion.js'
import { usesOutline } from '../utils/artistSelection'
import { activityLabel } from '../utils/activityTypes'
import { eventState } from '../utils/eventState'
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useEventsStore } from '../stores/events'
import { useLanguageStore } from '../stores/language'
import { dateKey } from '../utils/dates'
import { attendance } from '../utils/calendarDisplay'
import { getEventCategoryColor } from '../utils/config'

const props = defineProps({ day: String, state: Object })
const emit = defineEmits(['open', 'count', 'state'])
const data = useEventsStore(),
  lang = useLanguageStore(),
  selected = ref(props.state?.selected || 'all'),
  region = ref(props.state?.region || 'all')
const list = ref(null),
  overflow = ref(false)
let observer
const copy = computed(
  () =>
    ({
      zh: { region: '地区', empty: '暂无符合条件的活动', reset: '重置筛选' },
      en: { region: 'Region', empty: 'No activities match these filters', reset: 'Reset filters' },
      th: { region: 'ภูมิภาค', empty: 'ไม่มีกิจกรรมที่ตรงกับตัวกรอง', reset: 'รีเซ็ตตัวกรอง' },
    })[lang.currentLanguage],
)
function measure() {
  overflow.value = Boolean(list.value && list.value.scrollHeight > list.value.clientHeight + 1)
}
function savePosition() {
  emit('state', {
    selected: selected.value,
    region: region.value,
    scrollTop: list.value?.scrollTop || 0,
  })
}
watch([selected, region], async () => {
  await nextTick()
  if (list.value) list.value.scrollTop = 0
  savePosition()
  measure()
})
watch(
  () => props.day,
  () => {
    selected.value = 'all'
    region.value = 'all'
  },
)
onMounted(async () => {
  await nextTick()
  if (list.value) list.value.scrollTop = props.state?.scrollTop || 0
  observer = new ResizeObserver(measure)
  if (list.value) observer.observe(list.value)
  measure()
})
onBeforeUnmount(() => observer?.disconnect())
function regionLabel(area) {
  if (area === 'all') return lang.t.all
  return {
    zh: { thailand: '泰国', oversea: '海外' },
    en: { thailand: 'Thailand', oversea: 'Overseas' },
    th: { thailand: 'ไทย', oversea: 'ต่างประเทศ' },
  }[lang.currentLanguage][area]
}
const past = computed(() => props.day < dateKey(new Date()))
const rows = computed(() => data.onDate(props.day))
const visible = computed(() =>
  rows.value.filter(
    (r) =>
      matchesScheduleRegion(r, region.value) &&
      (selected.value === 'all' || attendance(r.city) === selected.value),
  ),
)
watch(
  visible,
  async (rows) => {
    emit('count', rows.length)
    await nextTick()
    measure()
  },
  { immediate: true },
)
</script>
<template>
  <div class="agenda-filters">
    <div class="agenda-attendance" role="group" :aria-label="lang.t.dayActivities">
      <button
        v-for="type in ['all', 'offline', 'online']"
        :key="type"
        :class="{ active: selected === type }"
        :aria-pressed="selected === type"
        @click="selected = type"
      >
        {{ lang.t[type] }}
      </button>
    </div>
    <div class="agenda-regions" role="group" :aria-label="copy.region">
      <span class="region-label">{{ copy.region }}</span
      ><button
        v-for="area in ['all', 'thailand', 'oversea']"
        :key="area"
        :class="{ active: region === area }"
        :aria-pressed="region === area"
        @click="region = area"
      >
        {{ regionLabel(area) }}
      </button>
    </div>
  </div>
  <div ref="list" class="day-capsules" @scroll="savePosition">
    <button
      v-for="entry in visible"
      :key="entry.id"
      class="day-capsule"
      :class="{
        official: usesOutline(entry),
        past,
        'status-faded': eventState(entry).faded,
      }"
      :style="{
        '--capsule-color': getEventCategoryColor(entry, data.artistCatalog).bg,
        '--capsule-text': getEventCategoryColor(entry, data.artistCatalog).text,
      }"
      :title="entry.name"
      @click="emit('open', entry)"
    >
      <span
        class="capsule-name"
        :class="{
          'name-struck': eventState(entry).cancelled || eventState(entry).postponed,
        }"
        >{{ entry.name }}</span
      >
      <span v-if="entry.roll_call" class="capsule-star" :aria-label="lang.t.rollCall">★</span>
      <span v-if="eventState(entry).label" class="status-label">{{ eventState(entry).label }}</span
      ><span v-if="data.updates.includes(entry.id)" class="update-label">update</span
      ><span class="capsule-type">{{ activityLabel(entry) }}</span>
    </button>
    <div v-if="!visible.length" class="agenda-empty" role="status">
      <p>{{ copy.empty }}</p>
      <button
        @click="
          selected = 'all';
          region = 'all'
        "
      >
        {{ copy.reset }}
      </button>
    </div>
  </div>
  <p v-if="overflow" class="day-scroll-hint">{{ lang.t.dayScrollHint }}</p>
</template>

<style scoped>
.agenda-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  flex: none;
}
.agenda-attendance,
.agenda-regions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.agenda-filters button {
  font: inherit;
  font-size: 13px;
  border: 0;
  background: transparent;
  color: var(--muted, #777);
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.agenda-attendance button {
  border-radius: 22px;
}
.agenda-attendance button.active {
  background: #f2f2f3;
  color: #30343a;
}
.agenda-regions button {
  padding: 8px 5px;
  border-radius: 0;
  position: relative;
}
.agenda-regions button.active {
  font-weight: 600;
  color: var(--text, #30343a);
}
.agenda-regions button.active:after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 15%;
  right: 15%;
  height: 2px;
  background: currentColor;
}
.region-label {
  font-size: 11px;
  color: var(--muted, #888);
  margin-right: 3px;
}
.agenda-empty {
  text-align: center;
  padding: 28px 8px;
  color: var(--muted, #777);
}
.agenda-empty button {
  border: 0;
  background: none;
  color: var(--text, #444);
  text-decoration: underline;
  cursor: pointer;
}
.day-capsules {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}
.day-scroll-hint {
  padding: 12px 0 0;
}
.agenda-filters button:focus-visible {
  outline: 2px solid #6f9dd4;
  outline-offset: 2px;
}
:global([data-theme='dark'] .agenda-attendance button.active) {
  background: #394352;
  color: #f1f4f8;
}
:global([data-theme='dark'] .agenda-regions button.active) {
  color: #e3eaf4;
}
@media (max-width: 420px) {
  .agenda-filters {
    gap: 6px 12px;
    margin-bottom: 16px;
  }
  .agenda-filters button {
    font-size: 12px;
    padding-inline: 8px;
  }
  .agenda-regions button {
    padding-inline: 4px;
  }
}
</style>
