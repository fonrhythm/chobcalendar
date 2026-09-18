<script setup>
import { ref, computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { useLanguageStore } from '../stores/language'
import { attendance } from '../utils/calendarDisplay'
import EventChip from './EventChip.vue'
import EventCard from './EventCard.vue'
import EmptyState from './EmptyState.vue'
const props = defineProps({ day: String })
const emit = defineEmits(['open'])
const data = useEventsStore(),
  lang = useLanguageStore(),
  selected = ref('all')
const rows = computed(() => data.onDate(props.day))
const visible = computed(() =>
  rows.value.filter((r) => selected.value === 'all' || attendance(r.city) === selected.value),
)
</script>
<template>
  <p class="day-summary">{{ rows.length }} {{ lang.t.dayCount }}</p>
  <div class="activity-tabs day-tabs">
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
  <div class="day-detail-list desktop-day-list">
    <EventCard
      v-for="entry in visible"
      :key="entry.id"
      :item="entry"
      @open="emit('open', $event)"
    />
  </div>
  <div class="mobile-day-list">
    <div v-for="entry in visible" :key="entry.id" class="day-mini">
      <EventChip :item="entry" @open="emit('open', $event)" />
      <span>{{ entry.type || lang.t.other }}</span>
    </div>
  </div>
  <EmptyState v-if="!visible.length" />
</template>
