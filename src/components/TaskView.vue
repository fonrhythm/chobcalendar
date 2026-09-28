<script setup>
import { computed } from 'vue';
import { useViewStore } from '../stores/view';
import { useEventsStore } from '../stores/events';
import { TASK_TYPES, taskCategory } from '../utils/tasks';
import EventChip from './EventChip.vue';
import MiniCalendar from './MiniCalendar.vue';
import DateStrip from './DateStrip.vue';
const emit = defineEmits(['open']),
  view = useViewStore(),
  data = useEventsStore();
const mine = computed(() =>
  data.filtered
    .filter((r) => data.myItems.includes(r.id))
    .sort((a, b) => a.date.localeCompare(b.date)),
);
const rows = computed(() => data.onDate(view.selectedDate, 'task'));
function open(item) {
  const parent =
    item.event_id && data.records.find((r) => r.id === item.event_id);
  emit('open', parent || item);
}
</script>
<template>
  <section class="task-dashboard">
    <div class="task-overview">
      <MiniCalendar />
      <section class="upcoming-items">
        <h2>我的日程</h2>
        <button
          v-for="item in mine"
          :key="item.id"
          class="task-row"
          @click="open(item)"
        >
          <span class="task-row-name"
            >{{ item.name }} · {{ item.activity }}</span
          ><time>{{ item.date.slice(5) }}</time>
        </button>
        <p v-if="!mine.length" class="muted">
          在活动详情中选择“加入我的事项”。
        </p>
      </section>
    </div>
    <DateStrip task />
    <div class="task-week-chips">
      <div v-for="day in view.taskDays" :key="day">
        <EventChip
          v-for="item in data.onDate(day, 'task').slice(0, 2)"
          :key="item.id"
          :item="item"
          @open="open"
        /><button
          v-if="data.onDate(day, 'task').length > 2"
          class="text-button"
          @click="view.selectDate(day)"
        >
          +{{ data.onDate(day, 'task').length - 2 }}
        </button>
      </div>
    </div>
    <div class="task-quadrants">
      <section
        v-for="(type, index) in TASK_TYPES"
        :key="type.value"
        class="task-quadrant"
        :style="{
          '--task-color': ['#c86e6c', '#6295bb', '#c5a15a', '#9192a3'][index],
        }"
      >
        <header>
          <h2>{{ type.label }}</h2>
          <span>{{
            rows.filter((r) => taskCategory(r.task_type) === type.value).length
          }}</span>
        </header>
        <div class="quadrant-rows">
          <div
            v-for="item in rows.filter(
              (r) => taskCategory(r.task_type) === type.value,
            )"
            :key="item.id"
            class="task-entry"
          >
            <button class="task-row" @click="open(item)">
              <i></i><span class="task-row-name">{{ item.activity || item.name }}</span
              ><time>{{ (item.end_date || item.date).slice(5) }}</time>
            </button>
            <p v-if="item.steps" class="task-steps">{{ item.steps }}</p>
            <a v-if="item.action_url" class="task-action" :href="item.action_url" target="_blank" rel="noopener noreferrer">操作链接 ↗</a>
          </div>
          <p
            v-if="!rows.some((r) => taskCategory(r.task_type) === type.value)"
            class="muted"
          >
            暂无事项
          </p>
        </div>
      </section>
    </div>
  </section>
</template>
