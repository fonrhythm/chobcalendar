<script setup>
import { computed } from 'vue'
import { useViewStore } from '../stores/view'
import { useEventsStore } from '../stores/events'
import { useLanguageStore } from '../stores/language'
import { monthCells, dateKey, parseDate } from '../utils/dates'
import EventChip from './EventChip.vue'
const emit = defineEmits(['day', 'open'])
const view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore()
const cells = computed(() => monthCells(view.month))
const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang.locale, { weekday: 'short' }).format(new Date(2026, 0, 4 + i)),
  ),
)
const stats = computed(() =>
  ['brand', 'series', 'stage', 'other'].map((type) => ({
    type,
    count: data.monthEvents.filter(
      (e) =>
        (['brand', 'series', 'stage'].includes(e.activity_type) ? e.activity_type : 'other') ===
        type,
    ).length,
  })),
)
const today = dateKey(new Date())
function label(day) {
  return new Intl.DateTimeFormat(lang.locale, { dateStyle: 'full' }).format(parseDate(day))
}
</script>
<template>
  <section class="stats" :aria-label="lang.t.monthCount">
    <div v-for="s in stats" :key="s.type">
      <strong>{{ s.count }}</strong
      ><span>{{ lang.t[s.type] }}</span>
    </div>
  </section>
  <section class="month-grid" :aria-label="view.month">
    <div v-for="(day, i) in weekdays" :key="i" class="weekday" :class="{ sunday: i === 0 }">
      {{ day }}
    </div>
    <div
      v-for="day in cells"
      :key="day"
      class="day-cell"
      :class="{ outside: !day.startsWith(view.month), past: day < today, today: day === today }"
      @click="emit('day', day)"
    >
      <button
        class="day-number"
        :aria-label="label(day)"
        :aria-current="day === today ? 'date' : undefined"
        @click.stop="emit('day', day)"
      >
        {{ Number(day.slice(-2)) }}
      </button>
      <div class="cell-events">
        <EventChip
          v-for="item in data.onDate(day).slice(0, 3)"
          :key="item.id"
          :item="item"
          @open="emit('open', $event)"
        />
      </div>
      <button v-if="data.onDate(day).length > 3" class="more" @click.stop="emit('day', day)">
        {{ lang.t.more.replace('{n}', data.onDate(day).length - 3) }}
      </button>
    </div>
  </section>
</template>
