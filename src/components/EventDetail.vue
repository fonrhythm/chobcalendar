<script setup>
import { computed } from 'vue'
import { useLanguageStore } from '../stores/language'
import { useEventsStore } from '../stores/events'
import { safeUrl, imageUrls } from '../utils/records'
import Icon from './Icon.vue'
import PosterGallery from './PosterGallery.vue'
const props = defineProps({ item: Object }),
  lang = useLanguageStore(),
  data = useEventsStore()
const images = computed(() => imageUrls(props.item.images))
const link = computed(() => safeUrl(props.item.link))
const linkHost = computed(() => (link.value ? new URL(link.value).hostname : ''))
</script>
<template>
  <div class="event-detail">
    <PosterGallery v-if="images.length" :item="item" />
    <h3>{{ item.name }}</h3>
    <p class="detail-activity">{{ item.activity }}</p>
    <dl>
      <div>
        <dt>{{ lang.t.start }}</dt>
        <dd>
          {{ item.date }} ·
          {{
            item.time_status === 'private'
              ? lang.t.private
              : item.time_status === 'all_day'
                ? lang.t.allDay
                : item.time || lang.t.tba
          }}
        </dd>
      </div>
      <div v-if="item.end_date || item.end_time">
        <dt>{{ lang.t.end }}</dt>
        <dd>{{ item.end_date || item.date }} {{ item.end_time }}</dd>
      </div>
      <div v-if="item.kind === 'event'">
        <dt>{{ lang.t.location }}</dt>
        <dd>{{ [item.venue, item.city].filter(Boolean).join(', ') || lang.t.tba }}</dd>
      </div>
      <div v-if="item.company">
        <dt>{{ lang.t.company }}</dt>
        <dd>{{ item.company }}</dd>
      </div>
      <div>
        <dt>{{ lang.t.category }}</dt>
        <dd>
          {{ lang.t[item.category] || item.category }}
          <template v-if="item.type"> · {{ item.type }}</template>
        </dd>
      </div>
      <div v-if="item.contact">
        <dt>{{ lang.t.contact }}</dt>
        <dd>
          {{ item.contact }} <span>{{ item.contact_method }}</span>
        </dd>
      </div>
    </dl>
    <p v-if="item.note" class="detail-note">{{ item.note }}</p>
    <a v-if="link" class="external-link" :href="link" target="_blank" rel="noopener noreferrer"
      ><span
        >{{ lang.t.link }}<small>{{ linkHost }}</small></span
      ><Icon name="arrow"
    /></a>
    <div v-if="!images.length" class="detail-footer">
      <button
        class="pill"
        :class="{ active: data.favorites.includes(item.id) }"
        @click="data.toggleFavorite(item.id)"
      >
        <Icon name="heart" />{{ data.favorites.includes(item.id) ? lang.t.saved : lang.t.favorite }}
      </button>
    </div>
  </div>
</template>
