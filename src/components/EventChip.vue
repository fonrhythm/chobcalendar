<script setup>
import { selectionCount } from '../utils/artistSelection';
import { eventState } from '../utils/eventState';
import { computed } from 'vue';
import { getCategoryColor } from '../utils/config';
import { useLanguageStore } from '../stores/language';
const props = defineProps({ item: Object, task: Boolean });
const emit = defineEmits(['open']);
const lang = useLanguageStore();
const state = computed(() => eventState(props.item));
const colors = computed(() => {
  const c = getCategoryColor('other', props.item.region);
  return {
    '--chip-bg': c.bg,
    '--chip-text': c.text,
    '--chip-border': c.bg,
  };
});
</script>
<template>
  <button
    class="chip"
    :class="{
      official: !task && selectionCount(item) >= 6,
      'task-chip': task,
      'status-faded': state.faded,
    }"
    :style="colors"
    :title="item.name"
    @click.stop="emit('open', item)"
  >
    <span
      class="chip-name"
      :class="{ 'name-struck': state.cancelled || state.postponed }"
      ><i v-if="item.roll_call && !task" class="roll-call-dot" aria-label="有点名"></i
      >{{ item.name }}</span
    ><span
      v-if="!task && selectionCount(item) >= 6"
      class="official-star"
      aria-hidden="true"
      >★</span
    ><span v-if="state.label" class="status-label">{{ state.label }}</span
    ><span v-if="!task && selectionCount(item) >= 6" class="sr-only">6人或组及以上</span>
  </button>
</template>
