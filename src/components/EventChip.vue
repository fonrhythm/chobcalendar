<script setup>
import { selectionCount } from '../utils/artistSelection';
import { eventState } from '../utils/eventState';
import { computed } from 'vue';
import { getCategoryColor } from '../utils/config';
import { useLanguageStore } from '../stores/language';
const props = defineProps({ item: Object });
const emit = defineEmits(['open']);
const lang = useLanguageStore();
const state = computed(() => eventState(props.item));
const colors = computed(() => {
  const c = getCategoryColor(props.item.category, props.item.region);
  return {
    '--chip-bg': c.bg,
    '--chip-text': c.text,
    '--chip-border':
      props.item.region === 'oversea' && props.item.category === 'actor'
        ? '#b0a090'
        : c.bg,
  };
});
</script>
<template>
  <button
    class="chip"
    :class="{
      official: selectionCount(item) > 6,
      'status-faded': state.faded,
    }"
    :style="colors"
    :title="item.name"
    @click.stop="emit('open', item)"
  >
    <span
      class="chip-name"
      :class="{ 'name-struck': state.cancelled || state.postponed }"
      ><i v-if="item.roll_call" class="roll-call-dot" aria-label="有点名"></i
      >{{ item.name }}</span
    ><span
      v-if="selectionCount(item) > 6"
      class="official-star"
      aria-hidden="true"
      >★</span
    ><span v-if="state.label" class="status-label">{{ state.label }}</span
    ><span v-if="selectionCount(item) > 6" class="sr-only">超过6人或组</span>
  </button>
</template>
