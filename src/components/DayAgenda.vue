<script setup>
import { selectionCount } from '../utils/artistSelection';
import { activityLabel } from '../utils/activityTypes';
import { eventState } from '../utils/eventState';
import { ref, computed } from 'vue';
import { useEventsStore } from '../stores/events';
import { useLanguageStore } from '../stores/language';
import { attendance } from '../utils/calendarDisplay';
import { getCategoryColor } from '../utils/config';

import EmptyState from './EmptyState.vue';
const props = defineProps({ day: String });
const emit = defineEmits(['open']);
const data = useEventsStore(),
  lang = useLanguageStore(),
  selected = ref('all');
const rows = computed(() => data.onDate(props.day));
const visible = computed(() =>
  rows.value.filter(
    (r) => selected.value === 'all' || attendance(r.city) === selected.value,
  ),
);
</script>
<template>
  <p class="day-summary">
    {{ lang.t.scheduleTotal.replace('{n}', visible.length) }}
  </p>
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
  <div class="day-capsules">
    <button
      v-for="entry in visible"
      :key="entry.id"
      class="day-capsule"
      :class="{
        official: selectionCount(entry) >= 6,
        'status-faded': eventState(entry).faded,
      }"
      :style="{
        '--capsule-color': getCategoryColor('other', entry.region).bg,
        '--capsule-text': getCategoryColor('other', entry.region).text,
      }"
      :title="entry.name"
      @click="emit('open', entry)"
    >
      <span
        class="capsule-name"
        :class="{
          'name-struck':
            eventState(entry).cancelled || eventState(entry).postponed,
        }"
        ><i v-if="entry.roll_call" class="roll-call-dot"></i
        >{{ entry.name }}</span
      >
      <span
        v-if="selectionCount(entry) >= 6"
        class="capsule-star"
        :aria-label="lang.t.official"
        >★</span
      >
      <span v-if="eventState(entry).label" class="status-label">{{
        eventState(entry).label
      }}</span
      ><span v-if="data.updates.includes(entry.id)" class="update-label"
        >update</span
      ><span class="capsule-type">{{ activityLabel(entry) }}</span>
    </button>
  </div>
  <EmptyState v-if="!visible.length" />
</template>
