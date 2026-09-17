<script setup>
import { computed } from 'vue'
import { useViewStore } from '../stores/view'
import { useLanguageStore } from '../stores/language'
import { parseDate } from '../utils/dates'
import Icon from './Icon.vue'
const props = defineProps({ task: Boolean })
const view = useViewStore(),
  lang = useLanguageStore(),
  days = computed(() => (props.task ? view.taskDays : view.weekDays))
function weekday(d) {
  return new Intl.DateTimeFormat(lang.locale, { weekday: 'short' }).format(parseDate(d))
}
</script>
<template>
  <div class="date-strip" :class="{ compact: task }">
    <button class="icon-button" :aria-label="lang.t.weekPrev" @click="view.shiftWeek(-1)">
      <Icon name="left" /></button
    ><button
      v-for="day in days"
      :key="day"
      class="strip-day"
      :class="{ selected: view.selectedDate === day }"
      :aria-pressed="view.selectedDate === day"
      :aria-label="day"
      @click="view.selectDate(day)"
    >
      <span>{{ weekday(day) }}</span
      ><b>{{ day.slice(-2) }}</b></button
    ><button class="icon-button" :aria-label="lang.t.weekNext" @click="view.shiftWeek(1)">
      <Icon name="right" />
    </button>
  </div>
</template>
