<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useEventsStore } from '../stores/events';
import { safeUrl } from '../utils/records';
const props = defineProps({ ticker: Boolean }),
  emit = defineEmits(['open']),
  data = useEventsStore(),
  index = ref(0),
  embed = ref('');
const current = computed(
  () =>
    data.announcements[index.value % Math.max(1, data.announcements.length)],
);
let timer;
onMounted(() => {
  timer = setInterval(() => {
    index.value++;
  }, 6000);
});
onBeforeUnmount(() => clearInterval(timer));
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
    <button @click="index = Math.max(0, index - 1)" aria-label="上一条通知">
      ↑</button
    ><a class="notice-scroll" :href="'#notice-' + current.id"><span>{{ current.title }}</span></a
    ><button @click="index++" aria-label="下一条通知">↓</button>
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
