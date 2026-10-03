<script setup>
import { selectionCount } from '../utils/artistSelection';
import { activityLabel } from '../utils/activityTypes';
import { useLanguageStore } from '../stores/language';
import { computed } from 'vue';
import { attendance, timeRange } from '../utils/calendarDisplay';
import Icon from './Icon.vue';
import { getCategoryColor } from '../utils/config';
const props = defineProps({ item: Object });
const range = computed(() => timeRange(props.item.time, props.item.end_time));
defineEmits(['open']);
const lang = useLanguageStore();
</script>
<template>
  <button
    class="event-card"
    :class="{ official: selectionCount(item) >= 6 }"
    :style="{
      '--official-color': getCategoryColor('other', item.region).bg,
      '--official-border':
        getCategoryColor('other', item.region).bg,
    }"
    @click="$emit('open', item)"
  >
    <div class="event-card-main">
      <div class="event-artist">
        {{ item.name }}
        <span
          v-if="selectionCount(item) >= 6"
          class="card-official"
          :title="lang.t.official"
          >★<span class="sr-only">{{ lang.t.official }}</span></span
        >
      </div>
      <div class="event-activity">{{ item.activity }}</div>
      <div class="location">
        {{
          attendance(item.city) === 'online'
            ? lang.t.broadcast
            : lang.t.location
        }}:
        <span>{{
          [item.venue, attendance(item.city) === 'online' ? '' : item.city]
            .filter(Boolean)
            .join(', ') || lang.t.tba
        }}</span>
      </div>
    </div>
    <span v-if="item.type" class="type-tag">{{ activityLabel(item) }}</span>
    <div class="event-times">
      <div :class="{ private: item.time_status === 'private' }">
        <i></i
        ><span>{{
          item.time_status === 'private'
            ? lang.t.private
            : item.time_status === 'all_day'
              ? lang.t.allDay
              : range.start || lang.t.tba
        }}</span>
      </div>
      <div v-if="range.end && !item.time_status" class="end-time">
        <i></i><span>{{ range.end }}</span>
      </div>
    </div>
    <Icon class="card-arrow" name="arrow" />
  </button>
</template>
