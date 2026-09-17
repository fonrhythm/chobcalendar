<script setup>
import { useViewStore } from '../stores/view'
import { useEventsStore } from '../stores/events'
import { useLanguageStore } from '../stores/language'
import { getCategoryColor } from '../utils/config'
import DateStrip from './DateStrip.vue'
import EmptyState from './EmptyState.vue'
import Icon from './Icon.vue'
const emit = defineEmits(['open']),
  view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore()
function style(item) {
  const c = getCategoryColor(item.category, item.region)
  return {
    '--chip-bg': c.bg,
    '--chip-text': c.text,
    '--chip-border': item.region === 'oversea' && item.category === 'actor' ? '#b0a090' : c.bg,
  }
}
</script>
<template>
  <section class="agenda-view task-view">
    <DateStrip task />
    <div class="task-list">
      <article
        v-for="item in data.onDate(view.selectedDate, 'task')"
        :key="item.id"
        class="task-card"
        :class="{ official: item.isofficial }"
        :style="style(item)"
      >
        <button
          class="task-open"
          :aria-label="item.name + ' ' + lang.t.detail"
          @click="emit('open', item)"
        ></button>
        <div class="task-top">
          <div>
            <h2>{{ item.name }}</h2>
            <p>{{ item.activity }}</p>
            <p v-if="item.note" class="task-note">{{ item.note }}</p>
          </div>
          <span class="task-type"
            >{{ lang.t[item.activity_type] || item.activity_type }}
            <span v-if="item.isofficial" :title="lang.t.official">★</span></span
          >
        </div>
        <div class="task-bottom">
          <div class="task-date">
            <strong>{{ item.date.slice(5).replace('-', ' / ') }}</strong
            ><span>{{ lang.t.start }} {{ item.time }}</span>
          </div>
          <a
            v-if="item.link"
            class="task-contact"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            >{{ item.contact || lang.t.link }} <Icon name="arrow"
          /></a>
          <div v-else-if="item.contact" class="task-contact">
            {{ item.contact }}<small>{{ item.contact_method }}</small>
          </div>
          <div v-if="item.end_date" class="task-date">
            <strong>{{ item.end_date.slice(5).replace('-', ' / ') }}</strong
            ><span>{{ lang.t.end }} {{ item.end_time }}</span>
          </div>
        </div>
      </article>
    </div>
    <EmptyState v-if="!data.onDate(view.selectedDate, 'task').length" />
  </section>
</template>
