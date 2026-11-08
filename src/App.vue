<script setup>
import CalendarMonthBar from './components/CalendarMonthBar.vue';
const scheduleFilters=ref(null);
import {supabase} from './api/supabase';
import {readPrivateDrama} from './drama/cloudReader.js';
const cloudDramaPreview=import.meta.env.DEV && new URLSearchParams(location.search).get('dramaSource')==='cloud';
const loadCloudDrama=()=>readPrivateDrama(supabase);
import CalendarSectionHeading from './components/CalendarSectionHeading.vue';
import {defineAsyncComponent} from 'vue';
import {legacyScheduleFilter} from './utils/scheduleRegion.js';
const DramaDisplay = import.meta.env.DEV ? defineAsyncComponent(()=>import('./drama/DramaPreview.vue')) : null;
const dramaPreviewEnabled = import.meta.env.DEV;
const dramaVisible = ref(dramaPreviewEnabled && location.hash === '#drama');
function openDrama(){modal.value='';dramaVisible.value=true;home.value=false;location.hash='drama';}
function openSchedule(){modal.value='';dramaVisible.value=false;home.value=false;location.hash='schedule';}
function applyHash(){if(!dramaPreviewEnabled)return;const hash=location.hash.slice(1);if(hash==='drama')openDrama();else if(hash==='home'||!hash)showHome();else if(hash==='schedule')openSchedule();else if(['china','thailand','oversea'].includes(hash)){view.scheduleRegion=legacyScheduleFilter(hash);openSchedule();}}

import { compareDisplayOrder } from './utils/displayOrder';
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
import { safeUrl, normalizeRecord } from './utils/records';
import Icon from './components/Icon.vue';
import { getEventCategoryColor } from './utils/config';
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
  if(dramaPreviewEnabled){view.scheduleRegion=legacyScheduleFilter(region);openSchedule();return;}
  dramaVisible.value=false;
  home.value = false;
  location.hash = region;
  view.setRegion(region);
}
function showHome() {
  dramaVisible.value=false;
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
    .filter((r) => data.myItems.includes(r.id) && data.isPending(r))
    .sort((a, b) => a.date.localeCompare(b.date) || compareDisplayOrder(a, b)),
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
let openRevision=0;
async function open(itemValue) {
  if(!itemValue?.id)return;
  if(itemValue.dramaPreview){linkedActivity.value=itemValue;return;}
  const revision=++openRevision;
  try{await data.ensureRecords([itemValue.kind==='task'?itemValue.event_id:itemValue.id]);itemValue=data.records.find(r=>r.id===itemValue.id)||itemValue}catch(e){data.personalError=e.message;return}
  if(revision!==openRevision)return;
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
let timer, dramaSyncTimer;
const linkedActivity=ref(null);
async function syncDramaActivities(){if(!dramaPreviewEnabled)return;try{let test;if(cloudDramaPreview){test=await loadCloudDrama();}else{const response=await fetch('/__drama_test_data');if(!response.ok)return;test=await response.json();}data.dramaPreviewEvents=test.events.map((event,index)=>({...normalizeRecord({id:'drama-test:'+event.id,name:event.name,date:event.date,time:event.time,region:event.region||'thailand',kind:'event',type:'press',activity_type:'press',venue:event.location||'',artist_ids:event.artistIds||[],note:'Drama 隔离测试活动'},index,'demo'),dramaPreview:true,dramaId:event.dramaId}));}catch{ /* Keep the last isolated snapshot if the test service is unavailable. */ }}

watch(()=>view.month,()=>data.sync());
function onVisible() {
  if (!document.hidden) {
    data.refreshCompletionClock();
    if (!data.preview) data.sync();
  }
}
function closeMenus(e) {
  document.querySelectorAll('.filter-menu[open]').forEach((el) => {
    if (!el.contains(e.target)) el.removeAttribute('open');
  });
}
onMounted(() => {
  syncDramaActivities();
  if(dramaPreviewEnabled)dramaSyncTimer=setInterval(syncDramaActivities,cloudDramaPreview?30000:2000);
  applyHash();
  window.addEventListener('hashchange',applyHash);
  account.initialize();
  theme.initTheme();
  if(dramaPreviewEnabled&&!cloudDramaPreview&&new URLSearchParams(location.search).get('demo')==='1')data.showDemo();else data.initialize();
  timer = setInterval(onVisible, 60 * 1000);
  document.addEventListener('visibilitychange', onVisible);
  document.addEventListener('click', closeMenus);
});
onBeforeUnmount(() => {
  window.removeEventListener('hashchange',applyHash);
  data.cancelSync();
  clearInterval(timer);
  clearInterval(dramaSyncTimer);
  document.removeEventListener('visibilitychange', onVisible);
  document.removeEventListener('click', closeMenus);
});
</script>
<template>
  <div
    class="site"
    :class="{ 'is-home': home, 'calendar-design-preview':dramaPreviewEnabled }"
    :data-region="view.currentRegion"
  >
    <HomePage
      v-if="home"
      @region="enterRegion"
      @drama="openDrama"
      @about="modal = 'about'"
      @tutorial="modal = 'tutorial'"
      @account="
        accountMode = $event;
        modal = 'profile';
      "
    /><template v-else
      ><header class="site-header">
        <nav v-if="dramaPreviewEnabled" class="site-nav" aria-label="Main navigation">
          <button @click="showHome">CHOB</button><span>›</span><button :class="{active:!dramaVisible}" @click="openSchedule">Schedule</button><span>›</span><button :class="{active:dramaVisible}" @click="openDrama">Drama</button><button v-if="cloudDramaPreview" @click="modal='profile'">管理员登录</button><span>›</span><button @click="modal='about'">About</button>
        <div v-if="!dramaVisible" class="c-nav-tools"><button aria-label="搜索" @click="scheduleFilters?.toggleSearch()"><Icon name="search" /></button><button aria-label="个人菜单" @click="modal='profile'"><Icon name="user" /></button><span><i></i>{{data.status==='synced'?'已同步':data.status==='demo'?'演示数据':'未连接'}}</span></div></nav><nav v-else class="site-nav" aria-label="Main navigation">
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
          ><span v-if="dramaPreviewEnabled">›</span><button v-if="dramaPreviewEnabled" @click="openDrama">DRAMA</button><span>›</span><button @click="modal = 'about'">ABOUT</button>
        </nav>
      </header>
      <KeepAlive><DramaDisplay v-if="dramaVisible" embedded :schedule-artists="data.artistCatalog" :load-snapshot="cloudDramaPreview?loadCloudDrama:null" /></KeepAlive>
      <template v-if="!dramaVisible">
<div v-if="dramaPreviewEnabled" class="c-schedule-hero"><CalendarSectionHeading word="Schedule" chinese="艺人行程" eyebrow="EVERY MOMENT, A LITTLE CLOSER" description="把每一次见面，放进日历。" /><div class="c-mobile-actions"><button aria-label="搜索" @click="scheduleFilters?.toggleSearch()"><Icon name="search" /></button><button aria-label="个人菜单" @click="modal='profile'"><Icon name="user" /></button></div><nav class="c-section-tabs"><button :class="{active:view.viewMode!=='task'}" @click="view.viewMode='calendar'">日历</button><button :class="{active:view.viewMode==='task'}" @click="view.viewMode='task';view.taskStart=view.selectedDate">事项</button></nav></div>
      <div class="c-schedule-card" :class="{'is-c-design':dramaPreviewEnabled}"><CalendarMonthBar v-if="dramaPreviewEnabled" :month="view.month" :title="monthTitle" :english="englishMonth" @previous="view.shiftMonth(-1)" @next="view.shiftMonth(1)" @today="view.today()"><div class="c-desktop-view"><button :class="{active:view.viewMode==='calendar'}" @click="view.viewMode='calendar'">月</button><button :class="{active:view.viewMode==='week'}" @click="view.viewMode='week'">周</button></div></CalendarMonthBar><section v-else class="month-heading">
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
      <FilterBar ref="scheduleFilters" :design-c="dramaPreviewEnabled"
        @favorites="showFavorites"
        @profile="modal = 'profile'"
        @my-items="modal = 'my-items'" />
      <main class="main-content">
        <div v-if="data.status === 'synced' && data.dataIssues.length" class="data-banner error-banner" role="status">
          {{ lang.t.syncPartial }} ({{ data.dataIssues.length }})
          <span v-if="account.admin">{{ data.dataIssues.map(issue => `${issue.id}: ${issue.message}`).join('; ') }}</span>
        </div>
        <div v-if="data.preview" class="data-banner demo-banner" role="status">
          {{ lang.t.demoNote }}
          <button v-if="data.error" class="text-button" @click="data.sync({ force: true })">
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
          {{ lang.t[data.syncMessageKey] || lang.t.errorNote }}
          <span v-if="data.records.length">{{ lang.t.staleNote }}</span>

          <span v-if="account.admin">{{ data.error }}</span
          ><button class="text-button" :disabled="data.retryAt > 0" @click="data.sync({ force: true })">
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
          <h2>{{ data.syncMessageKey === 'syncCooldown' ? lang.t.syncWaiting : data.status === 'error' ? lang.t.error : lang.t.connect }}</h2>
          <p>
            {{
              data.status === 'error' ? lang.t[data.syncMessageKey] || lang.t.errorNote : lang.t.connectNote
            }}
          </p>
          <button class="pill active" @click="data.showDemo()">
            {{ lang.t.preview }}
          </button>
        </div>
        <template v-else
          ><CalendarView :design-c="dramaPreviewEnabled"
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
        </div></main></div></template></template>
    <BaseModal v-if="linkedActivity" :title="linkedActivity.name" @close="linkedActivity=null"><p>{{linkedActivity.date}} {{linkedActivity.time}}</p><p>{{linkedActivity.venue}}</p><p>Press Tour / 观影活动 · 隔离测试</p><button @click="linkedActivity=null;openDrama()">查看关联 Drama</button></BaseModal>
    <footer class="copyright">
      Copyright © {{ new Date().getFullYear() }} — All rights reserved by
      SomenStjerne
    </footer>
    <button
      v-if="!home && !dramaVisible"
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
          ? getEventCategoryColor(item, data.artistCatalog).bg
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

<style scoped>
.schedule-intro{width:100%;max-width:none;margin:0;padding:40px 42px 6px;background:#fff;text-align:left}@media(max-width:700px){.schedule-intro{padding:20px 12px 6px}}
.calendar-design-preview{--bg:#fff;background:#fff}.calendar-design-preview .site-nav{max-width:none;margin:0}.calendar-design-preview :deep(.home-page){background:#fff}:global(html:has(.calendar-design-preview)),:global(body:has(.calendar-design-preview)){background:#fff}
.calendar-design-preview .month-heading{min-height:0;padding-top:4px;padding-bottom:14px}.calendar-design-preview .month-title h1{font-size:clamp(41px,calc(7vw - 3px),87px);font-weight:400}.calendar-design-preview .month-title h1 small{font-size:29px}@media(max-width:700px){.calendar-design-preview .month-title h1 small{font-size:23px}}
.schedule-heading-container{display:contents}.calendar-design-preview .schedule-heading-row{display:grid;grid-template-columns:minmax(520px,1.2fr) minmax(320px,1fr);align-items:center;gap:24px;padding:32px 42px 26px;border-bottom:1px solid var(--border)}.calendar-design-preview .schedule-heading-row .schedule-intro{padding:0}.calendar-design-preview .schedule-heading-row .month-heading{padding:0;border:0;background:transparent;gap:18px;min-width:0}.calendar-design-preview .month-title h1{letter-spacing:2px;white-space:nowrap}.calendar-design-preview .schedule-heading-row .month-heading-right{gap:22px}.calendar-design-preview .schedule-heading-row .year{margin-bottom:5px}@media(max-width:1000px){.calendar-design-preview .schedule-heading-row{grid-template-columns:1fr;padding:24px 30px 18px;gap:22px}.calendar-design-preview .schedule-heading-row .month-heading{width:100%}}@media(max-width:700px){.calendar-design-preview .schedule-heading-row{padding:24px 12px 16px;gap:18px}.calendar-design-preview .month-title h1{letter-spacing:1px}.calendar-design-preview .schedule-heading-row .month-heading{gap:12px}.calendar-design-preview .schedule-heading-row .month-heading-right{gap:12px}}
.c-schedule-card{display:contents}.calendar-design-preview .c-schedule-hero{position:relative;width:calc(100% - 64px);max-width:1184px;margin:0 auto;padding:56px 0 32px;box-sizing:border-box}.c-section-tabs{position:absolute;right:0;bottom:32px;display:flex;gap:28px}.c-section-tabs button,.c-desktop-view button{border:0;background:none;color:#74816f;padding:6px 0;font-size:14px;cursor:pointer}.c-section-tabs .active,.c-desktop-view .active{color:#27372d;border-bottom:2px solid #607d5a}.c-desktop-view{display:flex;gap:16px}.calendar-design-preview .c-schedule-card.is-c-design{display:block;max-width:1184px;width:calc(100% - 64px);margin:0 auto 48px;background:white;border:1px solid #e6e9e1;border-radius:9px;overflow:clip}.calendar-design-preview .c-schedule-card>.main-content{max-width:none;width:100%;padding:0;margin:0}.calendar-design-preview .c-schedule-card :deep(.filter-wrap){border:0;border-bottom:1px solid #eceee7;background:white}.calendar-design-preview .c-schedule-card :deep(.filter-bar){padding:10px 30px;min-height:54px;max-width:none;gap:24px;justify-content:flex-start;flex-wrap:wrap}.calendar-design-preview .c-schedule-card :deep(.segmented){background:none;border:0;padding:0;gap:24px;border-radius:0;box-shadow:none}.calendar-design-preview .c-schedule-card :deep(.segmented button){background:none;border:0;border-radius:0;padding:5px 0;color:#778273;box-shadow:none;font-size:13px}.calendar-design-preview .c-schedule-card :deep(.segmented button.active){background:none;color:#2c3930;border-bottom:2px solid #607d5a}.calendar-design-preview .c-schedule-card :deep(.dropdowns){margin-left:0;border-left:1px solid #d6ddce;padding-left:24px}.calendar-design-preview .c-schedule-card :deep(.month-grid){margin:0;border:0;border-radius:0;box-shadow:none}.calendar-design-preview .c-schedule-card :deep(.weekday){background:white;color:#758170;font-size:12px;font-weight:400;padding:12px 0}.calendar-design-preview .c-schedule-card :deep(.day-cell){background:white;border-color:#edf0e8}.calendar-design-preview .site-nav{height:55px;max-width:1260px;margin:auto;padding:0 38px;gap:16px}.c-nav-tools{margin-left:auto;display:flex;gap:20px;align-items:center}.c-nav-tools button,.c-mobile-actions button{border:0;background:none;padding:0;color:#26362e;cursor:pointer}.c-nav-tools svg,.c-mobile-actions svg{width:19px;height:19px}.c-nav-tools span{font-size:12px;color:#87917f;display:flex;align-items:center;gap:7px}.c-nav-tools i{width:6px;height:6px;background:#9aa68f;border-radius:50%}.c-mobile-actions{display:none}@media(max-width:700px){.calendar-design-preview .site-nav{padding:0 20px;gap:12px;height:55px}.calendar-design-preview .site-nav button{font-size:12px;letter-spacing:1px}.c-nav-tools{display:none}.calendar-design-preview .c-schedule-hero{width:100%;padding:28px 20px 54px}.c-section-tabs{left:20px;right:auto;bottom:8px;gap:30px}.c-mobile-actions{position:absolute;right:22px;top:28px;display:flex;gap:24px}.calendar-design-preview .c-schedule-card.is-c-design{width:calc(100% - 32px);margin-bottom:32px}.calendar-design-preview .c-schedule-card :deep(.filter-bar){padding:10px 16px;gap:10px 20px}.calendar-design-preview .c-schedule-card :deep(.dropdowns){width:100%;border:0;padding-left:0;gap:22px}.calendar-design-preview .c-schedule-card :deep(.segmented){gap:20px}.calendar-design-preview .c-schedule-card :deep(.day-cell){min-height:90px}}
.calendar-design-preview .c-schedule-card :deep(.c-week-switch){display:none}@media(max-width:700px){.calendar-design-preview .c-schedule-card :deep(.c-week-switch){display:flex}.calendar-design-preview .c-schedule-card :deep(.c-week-switch){border-right:1px solid #d6ddce;padding-right:20px}}
.calendar-design-preview :deep(.weekday.sunday){color:#a45a5a}.calendar-design-preview :deep(.weekday.saturday){color:#587b9c}
</style>
