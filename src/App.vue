<script setup>
import AccountPanel from './components/AccountPanel.vue';
import CorrectionForm from './components/CorrectionForm.vue';
import Announcements from './components/Announcements.vue';
import { useAccountStore } from './stores/account';
import HomePage from './components/HomePage.vue';
import TutorialContent from './components/TutorialContent.vue';
import { aboutParagraphs } from './data/about';
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useViewStore } from './stores/view';
import { useEventsStore } from './stores/events';
import { useLanguageStore } from './stores/language';
import { parseDate } from './utils/dates';
import { safeUrl } from './utils/records';
import Icon from './components/Icon.vue';
import { getCategoryColor } from './utils/config';
import FilterBar from './components/FilterBar.vue';
import CalendarView from './components/CalendarView.vue';
import WeekView from './components/WeekView.vue';
import TaskView from './components/TaskView.vue';
import BaseModal from './components/BaseModal.vue';
import EventDetail from './components/EventDetail.vue';
import DayAgenda from './components/DayAgenda.vue';
import EntryForm from './components/EntryForm.vue';
import { useThemeStore } from './stores/theme';
const account = useAccountStore(),
  editingEntry = ref(null),
  accountMode = ref('login');
const theme = useThemeStore();
const view = useViewStore(),
  data = useEventsStore(),
  lang = useLanguageStore();
if (['china', 'thailand', 'oversea'].includes(location.hash.slice(1)))
  view.setRegion(location.hash.slice(1));
const entryForm = ref(null),
  home = ref(!location.hash || location.hash === '#home'),
  fromDay = ref(false);
function enterRegion(region) {
  home.value = false;
  location.hash = region;
  view.setRegion(region);
}
function showHome() {
  home.value = true;
  location.hash = 'home';
}
function showFavorites() {
  home.value = false;
  view.onlyFavorites = true;
  view.viewMode = 'calendar';
  modal.value = '';
}
const myRows = computed(() =>
  data.records
    .filter((r) => data.myItems.includes(r.id))
    .sort((a, b) => a.date.localeCompare(b.date)),
);
function closeModal() {
  if (modal.value === 'day') {
    modal.value = '';
  } else if (modal.value === 'entry') entryForm.value?.requestClose();
  else if (modal.value === 'correction') modal.value = correctionTarget.value ? 'event' : '';
  else if (modal.value === 'event' && fromDay.value) {
    modal.value = 'day';
    fromDay.value = false;
  } else modal.value = '';
}
const modal = ref(''),
  item = ref(null),
  correctionTarget = ref(null),
  day = ref(''),
  entryUrl = safeUrl(import.meta.env.VITE_ENTRY_URL);
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
];
const monthNumber = computed(() => Number(view.month.slice(5)) - 1);
const monthTitle = computed(() =>
  lang.currentLanguage === 'zh'
    ? chineseMonths[monthNumber.value]
    : new Intl.DateTimeFormat(lang.locale, { month: 'long' }).format(
        parseDate(view.month + '-01'),
      ),
);
const englishMonth = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'short' }).format(
    parseDate(view.month + '-01'),
  ),
);
const modalTitle = computed(() =>
  ['tutorial', 'profile', 'my-items', 'correction'].includes(modal.value)
    ? {
        correction: '我要纠错',
        tutorial: '使用教程',
        profile: '个人资料',
        'my-items': '我的事项',
      }[modal.value]
    : modal.value === 'event'
      ? lang.t.detail
      : modal.value === 'day'
        ? day.value
        : modal.value === 'favorites'
          ? lang.t.favorites
          : modal.value === 'entry'
            ? lang.t.add
            : '关于 chob·calendar',
);
function open(itemValue) {
  fromDay.value =
    modal.value === 'day' || (modal.value === 'event' && fromDay.value);
  item.value = itemValue;
  modal.value = 'event';
}
function correctEvent() {
  correctionTarget.value = item.value?.kind === 'task'
    ? data.records.find((record) => record.id === item.value.event_id && record.kind === 'event') || null
    : item.value;
  modal.value = 'correction';
}
function correctFromFooter() {
  correctionTarget.value = null;
  modal.value = 'correction';
}
watch(
  () => data.records,
  (records) => {
    if (item.value) {
      const updated = records.find((r) => r.id === item.value.id);
      if (updated) item.value = updated;
    }
  },
);
function openDay(value) {
  data.markDateRead(value);
  day.value = value;
  modal.value = 'day';
}
let timer;
function onVisible() {
  if (!document.hidden && !data.preview) data.sync();
}
function closeMenus(e) {
  document.querySelectorAll('.filter-menu[open]').forEach((el) => {
    if (!el.contains(e.target)) el.removeAttribute('open');
  });
}
onMounted(() => {
  account.initialize();
  theme.initTheme();
  data.initialize();
  timer = setInterval(onVisible, 60 * 1000);
  document.addEventListener('visibilitychange', onVisible);
  document.addEventListener('click', closeMenus);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener('visibilitychange', onVisible);
  document.removeEventListener('click', closeMenus);
});
</script>
<template>
  <div
    class="site"
    :class="{ 'is-home': home }"
    :data-region="view.currentRegion"
  >
    <HomePage
      v-if="home"
      @region="enterRegion"
      @about="modal = 'about'"
      @tutorial="modal = 'tutorial'"
      @account="
        accountMode = $event;
        modal = 'profile';
      "
    /><template v-else
      ><header class="site-header">
        <nav class="site-nav" aria-label="Main navigation">
          <button @click="showHome">CHOB</button><span>›</span
          ><button
            :class="{ active: view.currentRegion === 'china' }"
            @click="enterRegion('china')"
          >
            CHINA</button
          ><span>›</span
          ><button
            :class="{ active: view.currentRegion === 'thailand' }"
            @click="enterRegion('thailand')"
          >
            THAILAND</button
          ><span>›</span
          ><button
            :class="{ active: view.currentRegion === 'oversea' }"
            @click="enterRegion('oversea')"
          >
            OVERSEA</button
          ><span>›</span><button @click="modal = 'about'">ABOUT</button>
        </nav>
      </header>
      <section class="month-heading">
        <button
          class="icon-button"
          :aria-label="lang.t.monthPrev"
          @click="view.shiftMonth(-1)"
        >
          <Icon name="left" />
        </button>
        <div class="month-title">
          <span class="year">{{ view.month.slice(0, 4) }}</span>
          <h1>
            {{ monthTitle
            }}<small v-if="lang.currentLanguage === 'zh'">{{
              englishMonth
            }}</small>
          </h1>
        </div>
        <div class="month-heading-right">
          <button class="today-button" @click="view.today()">
            {{ lang.t.today }}</button
          ><button
            class="icon-button"
            :aria-label="lang.t.monthNext"
            @click="view.shiftMonth(1)"
          >
            <Icon name="right" />
          </button>
        </div>
      </section>
      <FilterBar
        @favorites="showFavorites"
        @profile="modal = 'profile'"
        @my-items="modal = 'my-items'" />
      <main class="main-content">
        <div v-if="data.preview" class="data-banner demo-banner" role="status">
          {{ lang.t.demoNote }}
          <button v-if="data.error" class="text-button" @click="data.sync()">
            {{ lang.t.retry }}
          </button>
        </div>
        <div
          v-if="
            data.status === 'stale' ||
            data.status === 'error' ||
            data.status === 'demo-error'
          "
          class="data-banner error-banner"
          role="status"
        >
          {{
            data.status === 'stale'
              ? '已显示上次缓存内容'
              : '暂时无法加载活动，请稍后重试'
          }}

          <span v-if="account.admin">{{ data.error }}</span
          ><button class="text-button" @click="data.sync()">
            {{ lang.t.retry }}
          </button>
        </div>
        <div
          v-if="
            data.status === 'unconfigured' ||
            (data.status === 'error' && !data.records.length)
          "
          class="connection-state"
        >
          <Icon name="calendar" />
          <h2>{{ data.status === 'error' ? lang.t.error : lang.t.connect }}</h2>
          <p>
            {{
              data.status === 'error' ? lang.t.errorNote : lang.t.connectNote
            }}
          </p>
          <button class="pill active" @click="data.showDemo()">
            {{ lang.t.preview }}
          </button>
        </div>
        <template v-else
          ><CalendarView
            v-if="view.viewMode === 'calendar'"
            @day="openDay"
            @open="open" /><WeekView
            v-else-if="view.viewMode === 'week'"
            @open="open" /><TaskView v-else @open="open"
        /></template>
        <Announcements @open="open" />
        <div class="bottom-actions">
          <a
            v-if="entryUrl"
            class="pill"
            :href="entryUrl"
            target="_blank"
            rel="noopener noreferrer"
            ><Icon name="plus" />{{ lang.t.add }}</a
          ><button
            v-else
            class="pill"
            @click="
              editingEntry = null;
              modal = 'entry';
            "
          >
            <Icon name="plus" />{{ lang.t.add }}</button
          ><button class="pill" @click="correctFromFooter">我要纠错</button
          ><button class="pill about-button" @click="modal = 'about'">
            ABOUT
          </button>
        </div>
        <button class="tutorial-link" @click="modal = 'tutorial'">
          使用教程
        </button>

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
          <span
            class="icon-button"
            title="欢迎合作联系"
            aria-label="欢迎合作联系"
            ><Icon name="handshake"
          /></span>
        </div></main
    ></template>
    <footer class="copyright">
      Copyright © {{ new Date().getFullYear() }} — All rights reserved by
      SomenStjerne
    </footer>
    <button
      v-if="!home"
      class="floating-add"
      :aria-label="lang.t.add"
      @click="modal = 'entry'"
    >
      <Icon name="plus" />
    </button>
    <BaseModal
      v-if="modal"
      :title="modalTitle"
      :form="modal === 'entry'"
      :wide="modal === 'day'"
      :subtitle="modal === 'day' ? lang.t.dayActivities : undefined"
      :accent="
        modal === 'event' && item
          ? getCategoryColor('other', item.region).bg
          : undefined
      "
      @close="closeModal"
    >
      <EventDetail
        v-if="modal === 'event'"
        :item="item"
        @open="open"
        @correct="correctEvent"
      />
      <DayAgenda
        v-else-if="modal === 'day'"
        :key="day"
        :day="day"
        @open="open"
      />
      <template v-else-if="modal === 'favorites'"
        ><p class="muted">{{ lang.t.localFavorites }}</p>
        <button
          class="pill"
          :class="{ active: view.onlyFavorites }"
          @click="
            () => {
              view.onlyFavorites = !view.onlyFavorites;
              modal = '';
            }
          "
        >
          {{ lang.t.favorites }} · {{ data.favorites.length }}
        </button></template
      >
      <EntryForm
        v-else-if="modal === 'entry'"
        :editing="editingEntry"
        ref="entryForm"
        @close="modal = ''"
      />
      <TutorialContent v-else-if="modal === 'tutorial'" />
      <section v-else-if="modal === 'my-items'">
        <button
          v-for="row in myRows"
          :key="row.id"
          class="task-row"
          @click="open(row)"
        >
          <span>{{ row.name }} · {{ row.activity }}</span
          ><time>{{ row.date }}</time></button
        ><label v-for="row in myRows" :key="'tag-' + row.id" class="item-tag"
          >{{ row.name
          }}<input
            v-model="account.tags[row.id]"
            maxlength="40"
            placeholder="待办标签，例如：待开票"
            @change="account.save().catch((e) => (account.error = e.message))"
        /></label>
        <p v-if="account.error" role="alert">{{ account.error }}</p>
        <p v-if="!myRows.length">尚未添加事项，请从活动详情添加。</p>
      </section>
      <AccountPanel
        v-else-if="modal === 'profile'"
        :initial-mode="accountMode"
        @edit="
          editingEntry = $event;
          modal = 'entry';
        "
        @open="open"
      />
      <CorrectionForm
        v-else-if="modal === 'correction'"
        :item="correctionTarget"
        @close="modal = correctionTarget ? 'event' : ''"
      />
      <template v-else
        ><div class="about-content">
          <span class="about-wordmark">CHOB<span>CALENDAR</span></span>
          <div class="about-actions">
            <button class="text-link" @click="modal = 'tutorial'">
              使用教程</button
            ><button class="text-link" @click="modal = 'entry'">新增活动</button
            ><button class="text-link" disabled title="支持链接筹备中">
              Buy me a coffee
            </button>
          </div>
          <h3>管理员的话</h3>
          <p v-for="paragraph in aboutParagraphs" :key="paragraph">
            {{ paragraph }}
          </p>

          <p v-if="data.updatedAt" class="muted">
            {{ lang.t.updated }} ·
            {{ new Date(data.updatedAt).toLocaleString(lang.locale) }}
          </p>
          <a class="external-link" href="mailto:chobcalendar@gmail.com"
            >chobcalendar@gmail.com<Icon name="mail"
          /></a></div
      ></template>
    </BaseModal>
  </div>
</template>
