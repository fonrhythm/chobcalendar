<script setup>
import { computed } from 'vue';
import { monthCells } from '../utils/dates';
import { useViewStore } from '../stores/view';
const view = useViewStore(),
  cells = computed(() => monthCells(view.month));
</script>
<template>
  <div class="mini-calendar">
    <header>
      <button @click="view.shiftMonth(-1)" aria-label="上个月">‹</button
      ><strong>{{ view.month }}</strong
      ><button @click="view.shiftMonth(1)" aria-label="下个月">›</button>
    </header>
    <div class="mini-grid">
      <span v-for="d in ['日', '一', '二', '三', '四', '五', '六']" :key="d">{{
        d
      }}</span
      ><template v-for="d in cells" :key="d"
        ><button
          v-if="d.startsWith(view.month)"
          :class="{ selected: d === view.selectedDate }"
          :aria-label="d"
          @click="view.selectDate(d)"
        >
          {{ +d.slice(-2) }}</button
        ><span v-else></span
      ></template>
    </div>
  </div>
</template>
