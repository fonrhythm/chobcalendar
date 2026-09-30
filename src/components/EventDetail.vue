<script setup>
import { artistTypes } from '../utils/artistSelection';
import { activityLabel } from '../utils/activityTypes';
import { eventState, dateExplanation } from '../utils/eventState';
import { computed } from 'vue';
import { useLanguageStore } from '../stores/language';
import { useEventsStore } from '../stores/events';
import { safeUrl, imageUrls } from '../utils/records';
import { attendance, displayTime } from '../utils/calendarDisplay';
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
const images = computed(() => imageUrls(props.item.images));
const link = computed(() => safeUrl(props.item.link));
const linkHost = computed(() =>
  link.value ? new URL(link.value).hostname : '',
);
const eventTasks = computed(() =>
  data.records.filter((row) => row.kind === 'task' && row.event_id === props.item.id),
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
      {{ item.name }}<small v-if="item.roll_call">（有点名）</small>
    </h3>
    <p v-if="state.pending" class="verification-hint">此处信息待核实</p>
    <p class="detail-activity" :class="fieldClass('activity')">
      {{ item.activity }}
    </p>
    <dl>
      <div>
        <dt>{{ lang.t.dateLabel }}</dt>
        <dd>
          <span :class="fieldClass('date')">{{ dateExplanation(item) }}</span
          ><button
            v-if="
              item.related_event_id &&
              data.records.some((r) => r.id === item.related_event_id)
            "
            class="text-button"
            @click="
              emit(
                'open',
                data.records.find((r) => r.id === item.related_event_id),
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
      <div v-if="item.company">
        <dt>{{ lang.t.company }}</dt>
        <dd :class="fieldClass('company')">{{ item.company }}</dd>
      </div>
      <div>
        <dt>{{ lang.t.category }}</dt>
        <dd>
          {{
            artistTypes(
              item.artist_types?.length
                ? item.artist_types
                : [lang.t[item.category] || item.category],
            ).join(' · ')
          }}
          <template> · {{ activityLabel(item) }}</template>
        </dd>
      </div>
      <div v-if="item.contact">
        <dt>{{ lang.t.contact }}</dt>
        <dd>
          {{ item.contact }} <span>{{ item.contact_method }}</span>
        </dd>
      </div>
      <div v-if="item.participation_label || item.participation_condition">
        <dt>参与方式</dt>
        <dd>{{ item.participation_label || item.participation_condition }}</dd>
      </div>
    </dl>

    <section v-if="item.participation_rules" class="detail-remarks">
      <h4>活动详情与参与规则</h4>
      <p style="white-space: pre-wrap">{{ item.participation_rules }}</p>
    </section>
    <section v-if="eventTasks.length" class="detail-remarks">
      <h4>参与事项</h4>
      <article v-for="task in eventTasks" :key="task.id" class="detail-task">
        <strong>{{ task.activity }}</strong>
        <p v-if="task.steps" style="white-space: pre-wrap">{{ task.steps }}</p>
        <a v-if="task.action_url" :href="task.action_url" target="_blank" rel="noopener noreferrer">操作链接 ↗</a>
      </article>
    </section>

    <aside class="detail-remarks">
      <h4>备注</h4>
      <p :class="fieldClass('note')">{{ item.note || '暂无备注' }}</p>
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
