<script setup>
import { selectionCount, usesOutline } from '../utils/artistSelection';
import { eventState } from '../utils/eventState';
import { computed } from 'vue';
import { useEventsStore } from '../stores/events';
import { getEventCategoryColor } from '../utils/config';
import { useLanguageStore } from '../stores/language';
const props = defineProps({ item: Object, task: Boolean });
const emit = defineEmits(['open']);
const lang = useLanguageStore();
const data = useEventsStore();
const state = computed(() => eventState(props.item));
const colors = computed(() => {
  const c = getEventCategoryColor(props.item, data.artistCatalog);
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
      official: !task && usesOutline(item),
      'has-roll-call': item.roll_call && !task,
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
      >{{ item.name }}</span
    ><span
      v-if="!task && item.roll_call"
      class="official-star"
      :aria-label="lang.t.rollCall"
      :title="lang.t.rollCall"
      >★</span
    ><span v-if="state.label" class="status-label">{{ state.label }}</span
    ><span v-if="!task && selectionCount(item) >= 6" class="sr-only">6人或组及以上</span>
  </button>
</template>
