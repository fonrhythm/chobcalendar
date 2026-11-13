<script setup>
import {matchesScheduleRegion} from '../utils/scheduleRegion.js';
import { usesOutline } from '../utils/artistSelection';
import { activityLabel } from '../utils/activityTypes';
import { eventState } from '../utils/eventState';
import { ref, computed } from 'vue';
import { useEventsStore } from '../stores/events';
import { useLanguageStore } from '../stores/language';
import { dateKey } from '../utils/dates';
import { attendance } from '../utils/calendarDisplay';
import { getEventCategoryColor } from '../utils/config';

import EmptyState from './EmptyState.vue';
const props = defineProps({ day: String });
const emit = defineEmits(['open']);
const data = useEventsStore(),
  lang = useLanguageStore(),
  selected = ref('all'),region = ref('all');
function regionLabel(area){if(area==='all')return lang.t.all;return ({zh:{thailand:'泰国',oversea:'海外'},en:{thailand:'Thailand',oversea:'Overseas'},th:{thailand:'ไทย',oversea:'ต่างประเทศ'}})[lang.currentLanguage][area];}
const past = computed(() => props.day < dateKey(new Date()));
const rows = computed(() => data.onDate(props.day));
const visible = computed(() =>
  rows.value.filter(
    (r) => matchesScheduleRegion(r,region.value) && (selected.value === 'all' || attendance(r.city) === selected.value),
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
  <div class="activity-tabs day-tabs day-region-tabs" role="group" :aria-label="lang.t.region||'地区'">
    <button v-for="area in ['all','thailand','oversea']" :key="area" :class="{active:region===area}" :aria-pressed="region===area" @click="region=area">{{regionLabel(area)}}</button>
  </div>
  <div class="day-capsules">
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
          'name-struck':
            eventState(entry).cancelled || eventState(entry).postponed,
        }"
        >{{ entry.name }}</span
      >
      <span
        v-if="entry.roll_call"
        class="capsule-star"
        :aria-label="lang.t.rollCall"
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
