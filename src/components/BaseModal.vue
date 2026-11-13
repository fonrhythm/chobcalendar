<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useLanguageStore } from '../stores/language';
import Icon from './Icon.vue';
import {trapModalTab} from '../utils/modalFocus.js';
import {lockModalScroll} from '../utils/modalScrollLock.js';
defineProps({
  title: String,
  accessibleTitle: String,
  panelClass: String,
  wide: Boolean,
  accent: String,
  subtitle: String,
  scrollHint: String,
  gallery: Boolean,
  form: Boolean,
});
const emit = defineEmits(['close']),
  panel = ref(null),
  lang = useLanguageStore();
let previous, releaseScroll;
function key(e) {
  if (panel.value !== [...document.querySelectorAll('[role="dialog"]')].at(-1))
    return;
  if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
  }
  trapModalTab(e,panel.value);
}
onMounted(async () => {
  previous = document.activeElement;
  releaseScroll=lockModalScroll();
  await nextTick();
  panel.value.focus();
  document.addEventListener('keydown', key);
});
onBeforeUnmount(() => {
  releaseScroll?.();
  document.removeEventListener('keydown', key);
  previous?.focus();
});
</script>
<template>
  <Teleport to="body"
    ><div class="modal-backdrop" @click.self="emit('close')">
      <section
        ref="panel"
        class="modal"
        :class="[panelClass, {
          wide,
          'event-modal': accent,
          'gallery-modal': gallery,
          'day-modal': subtitle,
          'form-modal': form,
        }]"
        :style="accent ? { '--detail-accent': accent } : undefined"
        role="dialog"
        aria-modal="true"
        :aria-label="accessibleTitle||title"
        tabindex="-1"
      >
        <header class="modal-header">
          <div>
            <h2 v-if="!accent">{{ title }}</h2>
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
          </div>
          <button
            class="icon-button"
            :aria-label="lang.t.close"
            @click="emit('close')"
          >
            <Icon name="close" />
          </button>
        </header>
        <div class="modal-content"><slot /></div>
        <p v-if="scrollHint" class="day-scroll-hint">{{scrollHint}}</p>
        <div v-if="accent" class="detail-bottom-space" aria-hidden="true"></div>
      </section></div
  ></Teleport>
</template>
