<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useViewStore } from './stores/view'
import { useEventsStore } from './stores/events'
import { useLanguageStore } from './stores/language'
import { parseDate } from './utils/dates'
import { safeUrl } from './utils/records'
import Icon from './components/Icon.vue'
import { getCategoryColor } from './utils/config'
import FilterBar from './components/FilterBar.vue'
import CalendarView from './components/CalendarView.vue'
import WeekView from './components/WeekView.vue'
import TaskView from './components/TaskView.vue'
import BaseModal from './components/BaseModal.vue'
import EventDetail from './components/EventDetail.vue'
import DayAgenda from './components/DayAgenda.vue'
import EntryForm from './components/EntryForm.vue'
import { useThemeStore } from './stores/theme'
const theme = useThemeStore()
const view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore()
const entryForm = ref(null)
function closeModal() {
  if (modal.value === 'entry') entryForm.value?.requestClose()
  else modal.value = ''
}
const modal = ref(''),
  item = ref(null),
  day = ref(''),
  entryUrl = safeUrl(import.meta.env.VITE_ENTRY_URL)
const chineseMonths = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]
const monthNumber = computed(() => Number(view.month.slice(5)) - 1)
const monthTitle = computed(() =>
  lang.currentLanguage === 'zh'
    ? chineseMonths[monthNumber.value]
    : new Intl.DateTimeFormat(lang.locale, { month: 'long' }).format(parseDate(view.month + '-01')),
)
const englishMonth = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'short' }).format(parseDate(view.month + '-01')),
)
const modalTitle = computed(() =>
  modal.value === 'event'
    ? lang.t.detail
    : modal.value === 'day'
      ? day.value
      : modal.value === 'favorites'
        ? lang.t.favorites
        : modal.value === 'entry'
          ? lang.t.add
          : lang.t.about,
)
function open(itemValue) {
  item.value = itemValue
  modal.value = 'event'
}
function openDay(value) {
  day.value = value
  modal.value = 'day'
}
let timer
function onVisible() {
  if (!document.hidden && !data.preview) data.sync()
}
function closeMenus(e) {
  document.querySelectorAll('.filter-menu[open]').forEach((el) => {
    if (!el.contains(e.target)) el.removeAttribute('open')
  })
}
onMounted(() => {
  theme.initTheme()
  data.initialize()
  timer = setInterval(onVisible, 5 * 60 * 1000)
  document.addEventListener('visibilitychange', onVisible)
  document.addEventListener('click', closeMenus)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
  document.removeEventListener('click', closeMenus)
})
</script>
<template>
  <div class="site" :data-region="view.currentRegion">
    <header class="site-header">
      <nav class="site-nav" aria-label="Main navigation">
        <button
          @click="
            () => {
              view.setRegion('thailand')
              view.today()
              view.viewMode = 'calendar'
            }
          "
        >
          CHOB</button
        ><span>›</span
        ><button
          :class="{ active: view.currentRegion === 'china' }"
          @click="view.setRegion('china')"
        >
          CHINA</button
        ><span>›</span
        ><button
          :class="{ active: view.currentRegion === 'thailand' }"
          @click="view.setRegion('thailand')"
        >
          THAILAND</button
        ><span>›</span
        ><button
          :class="{ active: view.currentRegion === 'oversea' }"
          @click="view.setRegion('oversea')"
        >
          OVERSEA</button
        ><span>›</span><button @click="modal = 'about'">ABOUT</button>
      </nav>
    </header>
    <section class="month-heading">
      <button class="icon-button" :aria-label="lang.t.monthPrev" @click="view.shiftMonth(-1)">
        <Icon name="left" />
      </button>
      <div class="month-title">
        <span class="year">{{ view.month.slice(0, 4) }}</span>
        <h1>
          {{ monthTitle }}<small v-if="lang.currentLanguage === 'zh'">{{ englishMonth }}</small>
        </h1>
      </div>
      <div class="month-heading-right">
        <button class="today-button" @click="view.today()">{{ lang.t.today }}</button
        ><button class="icon-button" :aria-label="lang.t.monthNext" @click="view.shiftMonth(1)">
          <Icon name="right" />
        </button>
      </div>
    </section>
    <FilterBar @favorites="modal = 'favorites'" />
    <main class="main-content">
      <div v-if="data.preview" class="data-banner demo-banner" role="status">
        {{ lang.t.demoNote }}
        <button v-if="data.error" class="text-button" @click="data.sync()">
          {{ lang.t.retry }}
        </button>
      </div>
      <div
        v-if="data.status === 'stale' || data.status === 'error' || data.status === 'demo-error'"
        class="data-banner error-banner"
        role="status"
      >
        {{ data.status === 'stale' ? lang.t.staleNote : lang.t.errorNote }}
        <span v-if="data.error">{{ data.error }}</span>
        <button class="text-button" @click="data.sync()">{{ lang.t.retry }}</button>
      </div>
      <div
        v-if="data.status === 'unconfigured' || (data.status === 'error' && !data.records.length)"
        class="connection-state"
      >
        <Icon name="calendar" />
        <h2>{{ data.status === 'error' ? lang.t.error : lang.t.connect }}</h2>
        <p>{{ data.status === 'error' ? lang.t.errorNote : lang.t.connectNote }}</p>
        <button class="pill active" @click="data.showDemo()">{{ lang.t.preview }}</button>
      </div>
      <template v-else
        ><CalendarView v-if="view.viewMode === 'calendar'" @day="openDay" @open="open" /><WeekView
          v-else-if="view.viewMode === 'week'"
          @open="open" /><TaskView v-else @open="open"
      /></template>
      <div class="bottom-actions">
        <a v-if="entryUrl" class="pill" :href="entryUrl" target="_blank" rel="noopener noreferrer"
          ><Icon name="plus" />{{ lang.t.add }}</a
        ><button v-else class="pill" @click="modal = 'entry'">
          <Icon name="plus" />{{ lang.t.add }}</button
        ><button class="pill about-button" @click="modal = 'about'">ABOUT</button>
      </div>
      <div class="social-footer">
        <a
          href="https://xhslink.cn/m/6daqAMGfZbo"
          class="icon-button"
          target="_blank"
          rel="noopener noreferrer"
          title="小红书: SomenStjerne"
          aria-label="小红书: SomenStjerne"
          ><Icon name="heart"
        /></a>
        <a
          href="https://x.com/ChobCalendar"
          class="icon-button"
          target="_blank"
          rel="noopener noreferrer"
          title="X: ChobCalendar"
          aria-label="X: ChobCalendar"
          ><Icon name="brandX"
        /></a>
        <a
          href="https://www.threads.com/@chobcalendar"
          class="icon-button"
          target="_blank"
          rel="noopener noreferrer"
          title="Threads: chobcalendar"
          aria-label="Threads: chobcalendar"
          ><Icon name="chat"
        /></a>
        <a
          href="https://www.instagram.com/chobcalendar/"
          class="icon-button"
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram: chobcalendar"
          aria-label="Instagram: chobcalendar"
          ><Icon name="camera"
        /></a>
        <a
          href="mailto:chobcalendar@gmail.com"
          class="icon-button"
          title="chobcalendar@gmail.com"
          aria-label="Email"
          ><Icon name="mail"
        /></a>
        <span class="icon-button" title="欢迎合作联系" aria-label="欢迎合作联系"
          ><Icon name="handshake"
        /></span>
      </div>
    </main>
    <footer class="copyright">
      Copyright © {{ new Date().getFullYear() }} — All rights reserved by SomenStjerne
    </footer>
    <button class="floating-add" :aria-label="lang.t.add" @click="modal = 'entry'">
      <Icon name="plus" />
    </button>
    <BaseModal
      v-if="modal"
      :title="modalTitle"
      :form="modal === 'entry'"
      :wide="modal === 'day'"
      :subtitle="modal === 'day' ? lang.t.dayActivities : undefined"
      :accent="
        modal === 'event' && item ? getCategoryColor(item.category, item.region).bg : undefined
      "
      @close="closeModal"
    >
      <EventDetail v-if="modal === 'event'" :item="item" />
      <DayAgenda v-else-if="modal === 'day'" :key="day" :day="day" @open="open" />
      <template v-else-if="modal === 'favorites'"
        ><p class="muted">{{ lang.t.localFavorites }}</p>
        <button
          class="pill"
          :class="{ active: view.onlyFavorites }"
          @click="
            () => {
              view.onlyFavorites = !view.onlyFavorites
              modal = ''
            }
          "
        >
          {{ lang.t.favorites }} · {{ data.favorites.length }}
        </button></template
      >
      <EntryForm v-else-if="modal === 'entry'" ref="entryForm" @close="modal = ''" />
      <template v-else
        ><div class="about-content">
          <span class="about-wordmark">CHOB<span>CALENDAR</span></span>
          <p>{{ lang.t.aboutText }}</p>
          <p class="muted">{{ lang.t.aboutNote }}</p>
          <p v-if="data.updatedAt" class="muted">
            {{ lang.t.updated }} · {{ new Date(data.updatedAt).toLocaleString(lang.locale) }}
          </p>
          <a class="external-link" href="mailto:chobcalendar@gmail.com"
            >chobcalendar@gmail.com<Icon name="mail"
          /></a></div
      ></template>
    </BaseModal>
  </div>
</template>
