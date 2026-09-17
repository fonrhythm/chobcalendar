<script setup>
import { computed } from 'vue'
import { useViewStore } from '../stores/view'
import { useEventsStore } from '../stores/events'
import { useLanguageStore } from '../stores/language'
import DateStrip from './DateStrip.vue'
import EventCard from './EventCard.vue'
import EmptyState from './EmptyState.vue'
const emit = defineEmits(['open']),
  view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore()
const types = computed(() => ['all', ...new Set(data.events.map((e) => e.activity_type))])
const items = computed(() =>
  data
    .onDate(view.selectedDate)
    .filter((e) => view.activityType === 'all' || e.activity_type === view.activityType),
)
</script>
<template>
  <section class="agenda-view">
    <DateStrip />
    <div class="activity-tabs">
      <button
        v-for="type in types"
        :key="type"
        :class="{ active: view.activityType === type }"
        @click="view.activityType = type"
      >
        {{ lang.t[type] || type }}
      </button>
    </div>
    <div class="event-list">
      <EventCard v-for="item in items" :key="item.id" :item="item" @open="emit('open', $event)" />
    </div>
    <EmptyState v-if="!items.length" />
  </section>
</template>
