<script setup>
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
      official:
        item.isofficial ||
        item.artist_ids?.length > 1 ||
        item.artist_names?.length > 1 ||
        ['group', 'band'].includes(item.category),
      'status-faded': state.faded,
    }"
    :style="colors"
    :title="
      item.name + ' · ' + (item.isofficial ? lang.t.official : lang.t.fan)
    "
    @click.stop="emit('open', item)"
  >
    <span
      class="chip-name"
      :class="{ 'name-struck': state.cancelled || state.postponed }"
      ><i v-if="item.roll_call" class="roll-call-dot" aria-label="有点名"></i
      >{{ item.name }}</span
    ><span v-if="item.isofficial" class="official-star" aria-hidden="true"
      >★</span
    ><span v-if="state.label" class="status-label">{{ state.label }}</span
    ><span class="sr-only">{{
      item.isofficial ? lang.t.official : lang.t.fan
    }}</span>
  </button>
</template>
