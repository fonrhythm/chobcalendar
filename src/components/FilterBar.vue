<script setup>
import { ACTIVITY_TYPES } from '../utils/activityTypes';
import { computed, ref } from 'vue';
import { useViewStore } from '../stores/view';
import { useEventsStore } from '../stores/events';
import { useLanguageStore } from '../stores/language';
import { REGION_COLORS } from '../utils/config';
import Icon from './Icon.vue';
const emit = defineEmits(['favorites', 'profile', 'my-items']),
  view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore(),
  searchOpen = ref(false);
const cats = computed(() =>
  Object.keys(REGION_COLORS[view.currentRegion])
    .filter((k) => k.startsWith('c-'))
    .map((k) => k.slice(2)),
);
const state = computed(
  () =>
    lang.t[data.status === 'demo-error' ? 'demo' : data.status] ||
    lang.t.unconfigured,
);
function toggleFilter(key, value, all, checked) {
  const values = new Set(
    view[key].length ? view[key].filter((x) => x !== '__none__') : all,
  );
  if (checked) values.add(value);
  else values.delete(value);
  view[key] =
    values.size === all.length ? [] : values.size ? [...values] : ['__none__'];
}
</script>
<template>
  <div class="filter-wrap">
    <div class="filter-bar">
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
              view.viewMode = 'task';
              view.taskStart = view.selectedDate;
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
            <span v-if="view.companies.length"
              >({{ view.companies.length }})</span
            ><Icon name="down" />
          </summary>
          <div class="filter-options">
            <div class="filter-all-row">
              <label
                ><input
                  type="checkbox"
                  :checked="!view.companies.length"
                  @change="view.companies = []"
                />全选</label
              ><label
                ><input
                  type="checkbox"
                  :checked="view.companies.includes('__none__')"
                  @change="view.companies = ['__none__']"
                />全不选</label
              >
            </div>
            <label v-for="company in data.companies" :key="company"
              ><input
                type="checkbox"
                :checked="
                  !view.companies.length || view.companies.includes(company)
                "
                @change="
                  toggleFilter(
                    'companies',
                    company,
                    data.companies,
                    $event.target.checked,
                  )
                "
              />{{ company }}</label
            ><small v-if="!data.companies.length">{{ lang.t.emptyNote }}</small>
          </div>
        </details>
        <details class="filter-menu">
          <summary>
            艺人类别
            <span v-if="view.categories.length"
              >({{ view.categories.length }})</span
            ><Icon name="down" />
          </summary>
          <div class="filter-options">
            <div class="filter-all-row">
              <label
                ><input
                  type="checkbox"
                  :checked="!view.categories.length"
                  @change="view.categories = []"
                />全选</label
              ><label
                ><input
                  type="checkbox"
                  :checked="view.categories.includes('__none__')"
                  @change="view.categories = ['__none__']"
                />全不选</label
              >
            </div>
            <label v-for="cat in cats" :key="cat"
              ><input
                type="checkbox"
                :checked="
                  !view.categories.length || view.categories.includes(cat)
                "
                @change="
                  toggleFilter('categories', cat, cats, $event.target.checked)
                "
              />{{ lang.t[cat] }}</label
            >
          </div>
        </details>
        <details class="filter-menu">
          <summary>活动类型<Icon name="down" /></summary>
          <div class="filter-options">
            <div class="filter-all-row">
              <label
                ><input
                  type="checkbox"
                  :checked="!view.activityTypes.length"
                  @change="view.activityTypes = []"
                />全选</label
              ><label
                ><input
                  type="checkbox"
                  :checked="view.activityTypes.includes('__none__')"
                  @change="view.activityTypes = ['__none__']"
                />全不选</label
              >
            </div>
            <label v-for="type in ACTIVITY_TYPES" :key="type.id"
              ><input
                type="checkbox"
                :checked="
                  !view.activityTypes.length ||
                  view.activityTypes.includes(type.id)
                "
                @change="
                  toggleFilter(
                    'activityTypes',
                    type.id,
                    ACTIVITY_TYPES.map((t) => t.id),
                    $event.target.checked,
                  )
                "
              />{{ type.name }}</label
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
          <Icon name="search" />
        </button>
        <details class="filter-menu personal-menu">
          <summary aria-label="个人菜单"><Icon name="user" /></summary>
          <div class="filter-options">
            <button @click="emit('profile')">个人资料</button
            ><button @click="emit('favorites')">我的收藏</button
            ><button @click="emit('my-items')">我的事项</button>
          </div>
        </details>
        <button
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
            view.query = '';
            searchOpen = false;
          }
        "
      >
        {{ lang.t.close }}
      </button>
    </div>
    <div
      v-if="
        view.companies.length ||
        view.categories.length ||
        view.activityTypes.length ||
        view.onlyFavorites
      "
      class="active-filters"
    >
      <span
        >{{ lang.t.filterActive
        }}<template v-if="view.onlyFavorites">
          · {{ lang.t.favorites }}</template
        ></span
      ><button class="text-button" @click="view.resetFilters()">
        {{ lang.t.reset }} ×
      </button>
    </div>
  </div>
</template>
