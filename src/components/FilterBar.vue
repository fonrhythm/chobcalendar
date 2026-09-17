<script setup>
import { computed, ref } from 'vue'
import { useViewStore } from '../stores/view'
import { useEventsStore } from '../stores/events'
import { useLanguageStore } from '../stores/language'
import { REGION_COLORS } from '../utils/config'
import Icon from './Icon.vue'
const emit = defineEmits(['favorites']),
  view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore(),
  searchOpen = ref(false)
const cats = computed(() =>
  Object.keys(REGION_COLORS[view.currentRegion])
    .filter((k) => k.startsWith('c-'))
    .map((k) => k.slice(2)),
)
const state = computed(
  () => lang.t[data.status === 'demo-error' ? 'demo' : data.status] || lang.t.unconfigured,
)
</script>
<template>
  <div class="filter-wrap">
    <div class="filter-bar">
      <div class="segmented languages" aria-label="Language">
        <button
          v-for="(label, key) in { zh: '中', en: 'EN', th: 'ไทย' }"
          :key="key"
          :class="{ active: lang.currentLanguage === key }"
          :aria-pressed="lang.currentLanguage === key"
          @click="lang.setLanguage(key)"
        >
          {{ label }}
        </button>
      </div>
      <div class="segmented">
        <button
          :class="{ active: view.viewMode !== 'task' }"
          :aria-pressed="view.viewMode !== 'task'"
          @click="view.viewMode = 'calendar'"
        >
          {{ lang.t.calendar }}</button
        ><button
          :class="{ active: view.viewMode === 'task' }"
          :aria-pressed="view.viewMode === 'task'"
          @click="
            () => {
              view.viewMode = 'task'
              view.taskStart = view.selectedDate
            }
          "
        >
          {{ lang.t.task }}
        </button>
      </div>
      <div v-if="view.viewMode !== 'task'" class="segmented">
        <button
          :class="{ active: view.viewMode === 'calendar' }"
          :aria-pressed="view.viewMode === 'calendar'"
          @click="view.viewMode = 'calendar'"
        >
          {{ lang.t.month }}</button
        ><button
          :class="{ active: view.viewMode === 'week' }"
          :aria-pressed="view.viewMode === 'week'"
          @click="view.viewMode = 'week'"
        >
          {{ lang.t.week }}
        </button>
      </div>
      <div class="dropdowns">
        <details class="filter-menu">
          <summary>
            {{ lang.t.company }}
            <span v-if="view.companies.length">({{ view.companies.length }})</span
            ><Icon name="down" />
          </summary>
          <div class="filter-options">
            <button class="text-button" @click="view.companies = []">{{ lang.t.all }}</button
            ><label v-for="company in data.companies" :key="company"
              ><input v-model="view.companies" type="checkbox" :value="company" />{{
                company
              }}</label
            ><small v-if="!data.companies.length">{{ lang.t.emptyNote }}</small>
          </div>
        </details>
        <details class="filter-menu">
          <summary>
            {{ lang.t.category }}
            <span v-if="view.categories.length">({{ view.categories.length }})</span
            ><Icon name="down" />
          </summary>
          <div class="filter-options">
            <button class="text-button" @click="view.categories = []">{{ lang.t.all }}</button
            ><label v-for="cat in cats" :key="cat"
              ><input v-model="view.categories" type="checkbox" :value="cat" />{{
                lang.t[cat]
              }}</label
            >
          </div>
        </details>
      </div>
      <div class="filter-actions">
        <button
          class="icon-button"
          :aria-label="lang.t.search"
          :aria-expanded="searchOpen"
          @click="searchOpen = !searchOpen"
        >
          <Icon name="search" /></button
        ><button class="icon-button" :aria-label="lang.t.favorites" @click="emit('favorites')">
          <Icon name="user" /></button
        ><button
          class="sync-status"
          :class="data.status"
          :disabled="data.status === 'loading'"
          :title="lang.t.retry"
          @click="data.sync()"
        >
          <i></i>{{ state }}
        </button>
      </div>
    </div>
    <div v-if="searchOpen || view.query" class="search-row">
      <Icon name="search" /><input
        v-model="view.query"
        type="search"
        :placeholder="lang.t.search"
        :aria-label="lang.t.search"
      /><button
        class="text-button"
        @click="
          () => {
            view.query = ''
            searchOpen = false
          }
        "
      >
        {{ lang.t.close }}
      </button>
    </div>
    <div
      v-if="view.companies.length || view.categories.length || view.onlyFavorites"
      class="active-filters"
    >
      <span
        >{{ lang.t.filterActive
        }}<template v-if="view.onlyFavorites"> · {{ lang.t.favorites }}</template></span
      ><button class="text-button" @click="view.resetFilters()">{{ lang.t.reset }} ×</button>
    </div>
  </div>
</template>
