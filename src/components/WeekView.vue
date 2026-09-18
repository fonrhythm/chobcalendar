<script setup>
import { computed, ref } from 'vue'
import { attendance } from '../utils/calendarDisplay'
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
const types = ['all', 'offline', 'online']
const selectedType = ref('all')
const items = computed(() =>
  data
    .onDate(view.selectedDate)
    .filter((e) => selectedType.value === 'all' || attendance(e.city) === selectedType.value),
)
</script>
<template>
  <section class="agenda-view week-agenda">
    <DateStrip />
    <div class="activity-tabs">
      <button
        v-for="type in types"
        :key="type"
        :class="{ active: selectedType === type }"
        @click="selectedType = type"
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
