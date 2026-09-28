<script setup>
import Icon from './Icon.vue';
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useEventsStore } from '../stores/events';
import { safeUrl } from '../utils/records';
import { dateKey } from '../utils/dates';
import { activeTickerNotices } from '../utils/noticeTicker';
const props = defineProps({ ticker: Boolean }),
  emit = defineEmits(['open']),
  data = useEventsStore(),
  index = ref(0),
  embed = ref(''),
  today = ref(dateKey(new Date())),
  linkRef = ref(null),
  textRef = ref(null),
  overflowPx = ref(0);
const tickerNotices = computed(() =>
  activeTickerNotices(data.announcements, data.records, today.value),
);
const current = computed(
  () =>
    tickerNotices.value[index.value % Math.max(1, tickerNotices.value.length)],
);
const displayMs = computed(() =>
  Math.max(6000, Math.round(3200 + (overflowPx.value / 35) * 1000)),
);
let timer, observer, elapsed = 0;
function measureOverflow() {
  overflowPx.value = linkRef.value && textRef.value
    ? Math.max(0, Math.ceil(textRef.value.scrollWidth - linkRef.value.clientWidth))
    : 0;
}
watch(current, async () => {
  elapsed = 0;
  overflowPx.value = 0;
  await nextTick();
  if (!props.ticker) return;
  observer?.disconnect();
  if (linkRef.value) observer?.observe(linkRef.value);
  if (textRef.value) observer?.observe(textRef.value);
  measureOverflow();
});
onMounted(() => {
  if (!props.ticker) return;
  if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(measureOverflow);
  window.addEventListener('resize', measureOverflow);
  timer = setInterval(() => {
    today.value = dateKey(new Date());
    if (tickerNotices.value.length < 2) return;
    elapsed += 1000;
    if (elapsed >= displayMs.value) {
      index.value++;
      elapsed = 0;
    }
  }, 1000);
  nextTick(measureOverflow);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  observer?.disconnect();
  if (props.ticker) window.removeEventListener('resize', measureOverflow);
});
function open(n) {
  const r = data.records.find((r) => r.id === 'supabase:' + n.event_id);
  if (r) emit('open', r);
}
function xEmbed(url) {
  try {
    const u = new URL(url);
    if (
      !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(
        u.hostname,
      )
    )
      return '';
    const m = u.pathname.match(/\/status\/(\d+)/);
    return m ? 'https://platform.twitter.com/embed/Tweet.html?id=' + m[1] : '';
  } catch {
    return '';
  }
}
</script>
<template>
  <div
    v-if="ticker && current"
    class="announcement-ticker"
    aria-label="最新通知"
  >
    <Icon name="speaker" /><a
      ref="linkRef"
      class="notice-scroll"
      :class="{ 'is-overflowing': overflowPx > 1 }"
      :style="{ '--notice-overflow': overflowPx + 'px', '--notice-duration': displayMs + 'ms' }"
      :href="'#notice-' + current.id"
      ><span ref="textRef">{{ current.title }}</span></a
    >
  </div>
  <section v-else-if="!ticker" id="announcements" class="announcements">
    <h2>消息 / 公告</h2>
    <p v-if="!data.announcements.length" class="muted">暂无变动公告</p>
    <article
      v-for="n in data.announcements"
      :key="n.id"
      :id="'notice-' + n.id"
      class="message-card"
    >
      <h3>{{ n.title }}</h3>
      <p>{{ n.body }}</p>
      <div class="message-links">
        <button v-if="n.event_id" class="text-button" @click="open(n)">
          查看活动变动 →</button
        ><a
          v-if="safeUrl(n.source_url)"
          :href="safeUrl(n.source_url)"
          target="_blank"
          rel="noopener noreferrer"
          >消息来源 ↗</a
        ><button
          v-if="xEmbed(n.source_url)"
          class="text-button"
          @click="embed = embed === n.id ? '' : n.id"
        >
          {{ embed === n.id ? '收起贴文' : '展开 X 贴文' }}
        </button>
      </div>
      <iframe
        v-if="embed === n.id && xEmbed(n.source_url)"
        :src="xEmbed(n.source_url)"
        title="消息来源 X 贴文"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerpolicy="no-referrer"
      ></iframe>
    </article>
  </section>
</template>
