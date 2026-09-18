<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useLanguageStore } from '../stores/language'
import Icon from './Icon.vue'
defineProps({
  title: String,
  wide: Boolean,
  accent: String,
  subtitle: String,
  gallery: Boolean,
  form: Boolean,
})
const emit = defineEmits(['close']),
  panel = ref(null),
  lang = useLanguageStore()
let previous, oldOverflow
function key(e) {
  if (panel.value !== [...document.querySelectorAll('[role="dialog"]')].at(-1)) return
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
  if (e.key === 'Tab') {
    const nodes = [
      ...panel.value.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]'),
    ].filter((el) => !el.disabled && el.getClientRects().length)
    if (!nodes.length) {
      e.preventDefault()
      return
    }
    if (
      e.shiftKey &&
      (document.activeElement === nodes[0] || document.activeElement === panel.value)
    ) {
      e.preventDefault()
      nodes.at(-1).focus()
    } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
      e.preventDefault()
      nodes[0].focus()
    }
  }
}
onMounted(async () => {
  previous = document.activeElement
  oldOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  panel.value.focus()
  document.addEventListener('keydown', key)
})
onBeforeUnmount(() => {
  document.body.style.overflow = oldOverflow
  document.removeEventListener('keydown', key)
  previous?.focus()
})
</script>
<template>
  <Teleport to="body"
    ><div class="modal-backdrop" @click.self="emit('close')">
      <section
        ref="panel"
        class="modal"
        :class="{
          wide,
          'event-modal': accent,
          'gallery-modal': gallery,
          'day-modal': subtitle,
          'form-modal': form,
        }"
        :style="accent ? { '--detail-accent': accent } : undefined"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
      >
        <header class="modal-header">
          <div>
            <h2>{{ title }}</h2>
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
          </div>
          <button class="icon-button" :aria-label="lang.t.close" @click="emit('close')">
            <Icon name="close" />
          </button>
        </header>
        <div class="modal-content"><slot /></div>
      </section></div
  ></Teleport>
</template>
