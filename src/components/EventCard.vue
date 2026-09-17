<script setup>
import { useLanguageStore } from '../stores/language'
import Icon from './Icon.vue'
import { getCategoryColor } from '../utils/config'
defineProps({ item: Object })
defineEmits(['open'])
const lang = useLanguageStore()
</script>
<template>
  <button
    class="event-card"
    :class="{ official: item.isofficial }"
    :style="{
      '--official-color': getCategoryColor(item.category, item.region).bg,
      '--official-border':
        item.region === 'oversea' && item.category === 'actor'
          ? '#b0a090'
          : getCategoryColor(item.category, item.region).bg,
    }"
    @click="$emit('open', item)"
  >
    <div class="event-card-main">
      <div class="event-artist">
        {{ item.name }}
        <span v-if="item.isofficial" class="card-official" :title="lang.t.official"
          >★<span class="sr-only">{{ lang.t.official }}</span></span
        >
      </div>
      <div class="event-activity">{{ item.activity }}</div>
      <div class="location">
        {{ lang.t.location }}:
        <span>{{ [item.venue, item.city].filter(Boolean).join(', ') || lang.t.tba }}</span>
      </div>
    </div>
    <span v-if="item.type" class="type-tag">{{ item.type }}</span>
    <div class="event-times">
      <div :class="{ private: item.time_status === 'private' }">
        <i></i
        ><span>{{
          item.time_status === 'private'
            ? lang.t.private
            : item.time_status === 'all_day'
              ? lang.t.allDay
              : item.time || lang.t.tba
        }}</span>
      </div>
      <div v-if="item.end_time" class="end-time">
        <i></i><span>{{ item.end_time }}</span>
      </div>
    </div>
    <Icon class="card-arrow" name="arrow" />
  </button>
</template>
