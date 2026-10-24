<script setup>
import { eventArtistDisplayName } from "../utils/cpDisplayName";
import { eventState, dateExplanation } from '../utils/eventState';
import { computed } from 'vue';
import { useLanguageStore } from '../stores/language';
import { useEventsStore } from '../stores/events';
import { safeUrl, imageUrls } from '../utils/records';
import { attendance, displayTime } from '../utils/calendarDisplay';
import { richTextHtml, richTextForText } from '../utils/richText';
import { taskCompletion, completionLabel } from '../utils/taskCompletion';
import Icon from './Icon.vue';
import PosterGallery from './PosterGallery.vue';
const props = defineProps({ item: Object }),
  lang = useLanguageStore(),
  data = useEventsStore();
const emit = defineEmits(['open', 'correct']);
const state = computed(() => eventState(props.item));
const fieldClass = (field) => ({
  'unverified-field': props.item.pending_fields?.includes(field),
});
const attendees = computed(() => props.item.attendee_names || eventArtistDisplayName({ ...props.item, name: (props.item.artist_names?.length ? props.item.artist_names : (props.item.artist_ids || []).map(id => data.artistCatalog.find(a => a.id === id)?.name).filter(Boolean)).join(" / ") }, data.artistCatalog));
const images = computed(() => imageUrls(props.item.images));
const link = computed(() => safeUrl(props.item.link));
const descriptionHtml = computed(() => richTextHtml(richTextForText(props.item.rich_text?.description, props.item.participation_rules)));
const noteHtml = computed(() => richTextHtml(richTextForText(props.item.rich_text?.note, props.item.note || '暂无备注')));
const linkHost = computed(() =>
  link.value ? new URL(link.value).hostname : '',
);
const eventTasks = computed(() =>
  data.records.filter((row) => row.kind === 'task' && row.event_id === props.item.id).map(row => {
    const completion = taskCompletion(row, props.item, data.completionNow);
    return { ...row, completion, completionLabel: completionLabel(completion) };
  }),
);
</script>
<template>
  <div class="event-detail">
    <div class="detail-media">
      <div
        v-if="images.length"
        class="status-poster"
        :class="{
          'poster-faded': state.faded,
          'unverified-image': item.pending_fields?.includes('images'),
        }"
      >
        <PosterGallery :item="item" /><span
          v-if="state.label"
          class="poster-state"
          >{{
            state.cancelled
              ? 'Cancelled'
              : state.postponed
                ? 'Postpone'
                : '内容待核实'
          }}<small v-if="state.pending && (state.cancelled || state.postponed)"
            >内容待核实</small
          ></span
        >
      </div>
    </div>
    <h3 :class="fieldClass('name')">
      {{ item.name }}<small v-if="item.roll_call" :aria-label="lang.t.rollCall" :title="lang.t.rollCall"> ★</small>
    </h3>
    <p v-if="state.pending" class="verification-hint">此处信息待核实</p>
    <p class="detail-activity" :class="fieldClass('activity')">
      {{ item.activity }}
    </p>
    <dl>
      <div v-if="attendees"><dt>出席艺人</dt><dd>{{ attendees }}</dd></div>
      <div>
        <dt>{{ lang.t.dateLabel }}</dt>
        <dd>
          <span :class="fieldClass('date')">{{ dateExplanation(item) }}</span
          ><button
            v-if="
              item.related_event_id
            "
            class="text-button"
            @click="
              emit(
                'open',
                data.records.find((r) => r.id === item.related_event_id)||{id:item.related_event_id},
              )
            "
          >
            查看关联日期 →
          </button>
        </dd>
      </div>
      <div>
        <dt>{{ lang.t.time }}</dt>
        <dd :class="fieldClass('time')">
          {{
            displayTime(
              item.time ||
                (item.time_status === 'private'
                  ? lang.t.private
                  : item.time_status === 'all_day'
                    ? lang.t.allDay
                    : ''),
              item.region,
            ) || lang.t.tba
          }}
        </dd>
      </div>
      <div v-if="item.kind === 'event'">
        <dt>
          {{
            attendance(item.city) === 'online'
              ? lang.t.broadcast
              : lang.t.location
          }}
        </dt>
        <dd
          :class="{
            'unverified-field': item.pending_fields?.some((f) =>
              ['venue', 'city'].includes(f),
            ),
          }"
        >
          {{
            (attendance(item.city) === 'online'
              ? item.venue
              : [item.venue, item.city].filter(Boolean).join(', ')) ||
            lang.t.tba
          }}
        </dd>
      </div>
      <div v-if="item.contact">
        <dt>{{ lang.t.contact }}</dt>
        <dd>
          {{ item.contact }} <span>{{ item.contact_method }}</span>
        </dd>
      </div>
      <div v-if="(item.participation_label || item.participation_condition) && !/仅(?:获得|限)资格者/.test(item.participation_label || '')">
        <dt>参与方式</dt>
        <dd>{{ item.participation_label || item.participation_condition }}</dd>
      </div>
    </dl>

    <section v-if="item.participation_rules" class="detail-remarks detail-rich-section">
      <h4>活动详情与参与规则</h4>
      <div class="detail-rich-content" v-html="descriptionHtml"></div>
    </section>
    <section v-if="eventTasks.length" class="detail-remarks">
      <h4>参与事项</h4>
      <article v-for="task in eventTasks" :key="task.id" class="detail-task">
        <strong>{{ task.activity }}</strong>
        <span v-if="task.completion.closed"> · {{ task.completionLabel }}</span>
        <a v-if="task.result_url" :href="task.result_url" target="_blank" rel="noopener noreferrer">查看公示名单 ↗</a>
        <p v-if="task.steps" style="white-space: pre-wrap">{{ task.steps }}</p>
        <a v-if="task.action_url && !task.completion.closed" :href="task.action_url" target="_blank" rel="noopener noreferrer">操作链接 ↗</a>
      </article>
    </section>

    <aside class="detail-remarks detail-rich-section">
      <h4>备注</h4>
      <div class="detail-rich-content" :class="fieldClass('note')" v-html="noteHtml"></div>
    </aside>
    <a
      v-if="link"
      class="external-link"
      :class="fieldClass('link')"
      :href="link"
      target="_blank"
      rel="noopener noreferrer"
      ><span
        >{{ lang.t.link }}<small>{{ linkHost }}</small></span
      ><Icon name="arrow"
    /></a>
    <p v-if="data.personalError" role="alert">{{ data.personalError }}</p>
    <div class="detail-footer">
      <button class="pill" @click="emit('correct', item)">我要纠错</button
      ><button
        class="pill"
        :class="{ active: data.myItems.includes(item.id) }"
        @click="data.toggleMyItem(item.id)"
      >
        {{ data.myItems.includes(item.id) ? '已加入我的事项' : '加入我的事项' }}
      </button>
      <button
        class="pill"
        :class="{ active: data.favorites.includes(item.id) }"
        @click="data.toggleFavorite(item.id)"
      >
        <Icon name="heart" />{{
          data.favorites.includes(item.id) ? lang.t.saved : lang.t.favorite
        }}
      </button>
    </div>
  </div>
</template>
<style scoped>
.detail-rich-section {
  font-size: calc(1em - 3px);
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.detail-rich-section h4 {
  font-size: 1em;
  margin: 0 0 10px;
}
.detail-rich-content :deep(p) {
  margin: 0 0 0.65em;
  white-space: pre-wrap;
}
.detail-rich-content :deep(ul),
.detail-rich-content :deep(ol) {
  padding-left: 1.6em;
  margin: 0 0 0.65em;
}
.detail-rich-content :deep(li) {
  white-space: pre-wrap;
}
</style>
