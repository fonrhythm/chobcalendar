<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import Icon from './Icon.vue'
import { imageUrls } from '../utils/records'
import { useLanguageStore } from '../stores/language'
import { useEventsStore } from '../stores/events'
const props = defineProps({ item: Object })
const lang = useLanguageStore(),
  data = useEventsStore()
const loading = ref(true)
const warmed = new Set()
function preload() {
  if (images.value.length < 2) return
  for (const offset of [-1, 1]) {
    const url = images.value[(index.value + offset + images.value.length) % images.value.length]
    if (warmed.has(url)) continue
    warmed.add(url)
    const image = new Image()
    image.src = url
  }
}
function onImageError() {
  failed.value = true
  loading.value = false
}
function loaded() {
  loading.value = false
  preload()
}
const index = ref(0),
  expanded = ref(false),
  failed = ref(false),
  magnified = ref(false)
const images = computed(() => imageUrls(props.item.images))
watch(
  () => props.item.id,
  () => {
    index.value = 0
    failed.value = false
    expanded.value = false
  },
)
watch(
  () => images.value[index.value],
  () => {
    loading.value = true
    failed.value = false
    magnified.value = false
  },
)
function move(n) {
  index.value = (index.value + n + images.value.length) % images.value.length
}
let startX = 0,
  startY = 0,
  swiping = false
function start(e) {
  swiping = e.touches.length === 1
  if (swiping) {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
  }
}
function end(e) {
  if (!swiping || magnified.value || !e.changedTouches.length) return
  const dx = e.changedTouches[0].clientX - startX,
    dy = e.changedTouches[0].clientY - startY
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
  swiping = false
}
</script>
<template>
  <div v-if="images.length" class="poster-gallery">
    <div class="poster-stage" @touchstart.passive="start" @touchend.passive="end">
      <button class="poster-open" :aria-label="lang.t.enlarge" @click="expanded = true">
        <img
          v-if="!failed"
          :src="images[index]"
          :alt="item.name + ' · ' + (index + 1)"
          decoding="async"
          fetchpriority="high"
          @load="loaded"
          @error="onImageError"
        />
        <span v-else class="poster-error">{{ lang.t.imageFailed }}</span>
      </button>
      <span v-if="loading && !failed" class="poster-loading" role="status">{{
        lang.t.loadingImage
      }}</span>
      <button
        class="poster-favorite"
        :class="{ saved: data.favorites.includes(item.id) }"
        :aria-label="data.favorites.includes(item.id) ? lang.t.saved : lang.t.favorite"
        :aria-pressed="data.favorites.includes(item.id)"
        @click="data.toggleFavorite(item.id)"
      >
        <Icon name="heart" />
      </button>
      <div v-if="images.length > 1" class="poster-navigation">
        <button class="icon-button" :aria-label="lang.t.previous" @click="move(-1)">
          <Icon name="left" />
        </button>
        <span aria-live="polite">{{ index + 1 }} / {{ images.length }}</span>
        <button class="icon-button" :aria-label="lang.t.next" @click="move(1)">
          <Icon name="right" />
        </button>
      </div>
    </div>
    <BaseModal
      v-if="expanded"
      gallery
      :title="item.name + ' · ' + (index + 1) + ' / ' + images.length"
      @close="expanded = false"
    >
      <div
        class="lightbox-view"
        @keydown.left.prevent="move(-1)"
        @keydown.right.prevent="move(1)"
        @touchstart.passive="start"
        @touchend.passive="end"
      >
        <button
          v-if="images.length > 1"
          class="lightbox-prev icon-button"
          :aria-label="lang.t.previous"
          @click="move(-1)"
        >
          <Icon name="left" />
        </button>
        <div class="lightbox-scroll" :class="{ magnified }">
          <button
            class="lightbox-image"
            :aria-label="lang.t.zoom"
            :aria-pressed="magnified"
            @click="magnified = !magnified"
          >
            <img :src="images[index]" :alt="item.name + ' · ' + (index + 1)" />
          </button>
        </div>
        <button
          v-if="images.length > 1"
          class="lightbox-next icon-button"
          :aria-label="lang.t.next"
          @click="move(1)"
        >
          <Icon name="right" />
        </button>
      </div>
    </BaseModal>
  </div>
</template>
