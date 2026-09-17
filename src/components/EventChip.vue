<script setup>
import { computed } from 'vue'
import { getCategoryColor } from '../utils/config'
import { useLanguageStore } from '../stores/language'
const props = defineProps({ item: Object })
const emit = defineEmits(['open'])
const lang = useLanguageStore()
const colors = computed(() => {
  const c = getCategoryColor(props.item.category, props.item.region)
  return {
    '--chip-bg': c.bg,
    '--chip-text': c.text,
    '--chip-border':
      props.item.region === 'oversea' && props.item.category === 'actor' ? '#b0a090' : c.bg,
  }
})
</script>
<template>
  <button
    class="chip"
    :class="{ official: item.isofficial }"
    :style="colors"
    :title="item.name + ' · ' + (item.isofficial ? lang.t.official : lang.t.fan)"
    @click.stop="emit('open', item)"
  >
    <span>{{ item.name }}</span
    ><span v-if="item.isofficial" class="official-star" aria-hidden="true">★</span
    ><span class="sr-only">{{ item.isofficial ? lang.t.official : lang.t.fan }}</span>
  </button>
</template>
