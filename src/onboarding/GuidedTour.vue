<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, useId } from 'vue'
import { ARTIST_COLORS, MIXED_ARTIST_COLOR } from '../utils/config.js'
import { dramaCategoryColors } from '../drama/categoryColors.js'
import { dramaText } from '../drama/i18n.js'
import { useLanguageStore } from '../stores/language'
import { tours, tourCopy } from './config.js'
import { selectTourSteps } from './state.js'
import { lockModalScroll } from '../utils/modalScrollLock.js'
import { trapModalTab } from '../utils/modalFocus.js'
const props = defineProps({
  module: { type: String, required: true },
  state: { type: Object, required: true },
  manual: Boolean,
})
const emit = defineEmits(['finish', 'learn', 'prepare'])
const language = useLanguageStore()
const activeSteps = ref([]),
  started = ref(false),
  skipShared = ref(!props.manual),
  index = ref(0),
  card = ref(null),
  box = ref(null),
  position = ref({}),
  storageNotice = ref('')
const labels = computed(
  () =>
    ({
      zh: {
        offer: '要看看操作指南吗？',
        intro: '几步认识主要功能，随时可以跳过或从使用指南重新查看。',
        start: '开始教程',
        skip: '暂时跳过',
        skipTour: '跳过教程',
        common: '跳过已学过的共通内容',
        next: '下一步',
        back: '上一步',
        done: '开始使用',
        missing: '当前区域尚未显示，仍可先阅读这一步的说明。',
      },
      en: {
        offer: 'Would you like a quick tour?',
        intro: 'Learn the essentials in a few steps. Skip anytime and replay from the user guide.',
        start: 'Start tour',
        skip: 'Not now',
        skipTour: 'Skip tour',
        common: 'Skip shared topics already learned',
        next: 'Next',
        back: 'Back',
        done: 'Start using',
        missing: 'This area is not visible yet. You can still read the guidance.',
      },
      th: {
        offer: 'ต้องการดูคู่มือสั้น ๆ ไหม?',
        intro: 'เรียนรู้ฟังก์ชันหลักในไม่กี่ขั้นตอน ข้ามได้ทุกเมื่อและเปิดใหม่จากคู่มือได้',
        start: 'เริ่มคู่มือ',
        skip: 'ไว้ก่อน',
        skipTour: 'ข้ามคู่มือ',
        common: 'ข้ามเนื้อหาร่วมที่เรียนแล้ว',
        next: 'ถัดไป',
        back: 'ย้อนกลับ',
        done: 'เริ่มใช้งาน',
        missing: 'ส่วนนี้ยังไม่แสดง แต่สามารถอ่านคำอธิบายก่อนได้',
      },
    })[language.currentLanguage],
)
const steps = computed(() =>
    started.value
      ? activeSteps.value
      : selectTourSteps(tours[props.module] || [], props.state, skipShared.value),
  ),
  step = computed(() => steps.value[index.value]),
  title = computed(() =>
    started.value ? tourCopy(step.value.title, language.currentLanguage) : labels.value.offer,
  ),
  body = computed(() =>
    started.value ? tourCopy(step.value.body, language.currentLanguage) : labels.value.intro,
  ),
  maskId = 'tour-mask-' + useId().replace(/[^a-z0-9]/gi, '')
let release, previous, frame
const legend = computed(() =>
  props.module === 'schedule'
    ? [
        ...Object.entries(ARTIST_COLORS).map(([key, c]) => ({
          label: language.t[key] || key,
          bg: c.bg,
          text: c.text,
        })),
        {
          label: { zh: '混合阵容', en: 'Mixed', th: 'หลายประเภท' }[language.currentLanguage],
          bg: MIXED_ARTIST_COLOR.bg,
          text: MIXED_ARTIST_COLOR.text,
        },
      ]
    : Object.entries(dramaCategoryColors).map(([key, c]) => ({
        label:
          { 'Boys Love': 'BL', 'Girls Love': 'GL' }[key] ||
          dramaText(language.currentLanguage, key),
        bg: c.background,
        text: c.text,
      })),
)
function measure() {
  if (!started.value || !step.value) {
    box.value = null
    position.value = {}
    return
  }
  const target = document.querySelector(step.value.target)
  const r = target?.getBoundingClientRect()
  const vw = window.innerWidth,
    vh = window.innerHeight,
    w = Math.min(380, vw - 32),
    h = card.value?.getBoundingClientRect().height || 280
  box.value =
    r && r.width && r.height
      ? {
          x: Math.max(5, r.left - 6),
          y: Math.max(5, r.top - 6),
          width: Math.max(0, Math.min(vw - 5, r.right + 6) - Math.max(5, r.left - 6)),
          height: Math.max(0, Math.min(vh - 5, r.bottom + 6) - Math.max(5, r.top - 6)),
        }
      : null
  const x = Math.max(16, Math.min(vw - w - 16, r ? r.left + r.width / 2 - w / 2 : (vw - w) / 2))
  let y =
    r && r.bottom + h + 24 < vh ? r.bottom + 14 : r && r.top - h > 24 ? r.top - h - 14 : vh - h - 16
  y = Math.max(16, Math.min(vh - h - 16, y))
  position.value = { left: x + 'px', top: y + 'px', width: w + 'px' }
}
function scheduleMeasure() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}
async function prepare() {
  if (!started.value) return
  emit('prepare', step.value)
  await nextTick()
  await nextTick()
  document.querySelector(step.value?.target)?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  measure()
  card.value?.focus()
}
function start() {
  if (!steps.value.length) {
    emit('finish', 'completed')
    return
  }
  activeSteps.value = [...steps.value]
  started.value = true
  index.value = 0
  prepare()
}
function next() {
  emit('learn', step.value.common)
  if (index.value === steps.value.length - 1) emit('finish', 'completed')
  else {
    index.value++
    prepare()
  }
}
function back() {
  if (index.value > 0) {
    index.value--
    prepare()
  }
}
function key(e) {
  trapModalTab(e, card.value)
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('finish', 'skipped')
  }
}
watch(
  () => language.currentLanguage,
  () => nextTick(scheduleMeasure),
)
onMounted(async () => {
  previous = document.activeElement
  release = lockModalScroll()
  document.addEventListener('keydown', key, true)
  window.addEventListener('resize', scheduleMeasure)
  window.addEventListener('scroll', scheduleMeasure, true)
  await nextTick()
  card.value?.focus()
})
onBeforeUnmount(() => {
  release?.()
  cancelAnimationFrame(frame)
  document.removeEventListener('keydown', key, true)
  window.removeEventListener('resize', scheduleMeasure)
  window.removeEventListener('scroll', scheduleMeasure, true)
  if (previous?.isConnected) previous.focus()
})
</script>
<template>
  <Teleport to="body"
    ><div class="guided-tour" data-tour-overlay>
      <svg class="tour-shade" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask :id="maskId">
            <rect width="100%" height="100%" fill="white" />
            <rect v-if="box" v-bind="box" rx="10" fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="#0B1421"
          fill-opacity=".72"
          :mask="'url(#' + maskId + ')'"
        />
      </svg>
      <div
        v-if="box"
        class="tour-outline"
        :style="{
          left: box.x + 'px',
          top: box.y + 'px',
          width: box.width + 'px',
          height: box.height + 'px',
        }"
      ></div>
      <section
        ref="card"
        class="tour-card"
        :class="{ invitation: !started }"
        :style="position"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
      >
        <small
          >{{ module === 'schedule' ? 'Schedule' : 'Drama' }} ·
          <template v-if="started">{{ index + 1 }} / {{ steps.length }}</template
          ><template v-else>{{
            { zh: '使用指南', en: 'User guide', th: 'คู่มือ' }[language.currentLanguage]
          }}</template></small
        >
        <h2>{{ title }}</h2>
        <p>{{ body }}</p>
        <div v-if="started && step.id === 'chips'" class="tour-legend">
          <span
            v-for="item in legend"
            :key="item.label"
            :style="{ background: item.bg, color: item.text }"
            >{{ item.label }}</span
          ><strong v-if="module === 'schedule'">★ {{ language.t.rollCall }}</strong>
        </div>
        <p class="tour-missing" v-if="started && !box">{{ labels.missing }}</p>
        <label v-if="!started && state.learned.length" class="shared-choice"
          ><input v-model="skipShared" type="checkbox" />{{ labels.common }}</label
        >
        <div class="tour-actions" v-if="!started">
          <button @click="emit('finish', 'skipped')">{{ labels.skip }}</button
          ><button class="tour-primary" @click="start">{{ labels.start }}</button>
        </div>
        <template v-else
          ><div class="tour-actions">
            <button :disabled="index === 0" @click="back">{{ labels.back }}</button
            ><button class="tour-primary" @click="next">
              {{ index === steps.length - 1 ? labels.done : labels.next }}
            </button>
          </div>
          <button class="tour-skip" @click="emit('finish', 'skipped')">
            {{ labels.skipTour }}
          </button></template
        >
      </section>
    </div></Teleport
  >
</template>
<style scoped>
.guided-tour {
  position: fixed;
  inset: 0;
  z-index: 1800;
  color: #2a3442;
}
.tour-shade {
  position: absolute;
  inset: 0;
}
.tour-outline {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #8fb7e8;
  border-radius: 10px;
  pointer-events: none;
}
.tour-card {
  position: fixed;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #cfdae8;
  border-radius: 16px;
  padding: 24px;
  max-height: calc(100dvh - 32px);
  overflow: auto;
  overscroll-behavior: contain;
  outline: 0;
  box-shadow: 0 12px 40px #07101d33;
  font:
    14px/1.7 system-ui,
    -apple-system,
    'Microsoft YaHei',
    sans-serif;
}
.tour-card.invitation {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(400px, calc(100vw - 32px));
}
.tour-card h2 {
  font-size: 20px;
  line-height: 1.45;
  margin: 10px 0;
}
.tour-card p {
  font-size: 13px;
  margin: 12px 0 20px;
}
.tour-card small {
  font-size: 11px;
  color: #637b98;
  letter-spacing: 1px;
}
.tour-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}
.tour-actions button {
  font: inherit;
  font-size: 13px;
  padding: 9px 14px;
  border: 1px solid #cfdae8;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  min-height: 40px;
}
.tour-actions .tour-primary {
  background: #587daa;
  border-color: #587daa;
  color: white;
}
.tour-actions button:disabled {
  opacity: 0.4;
  cursor: default;
}
.tour-skip {
  display: block;
  margin: 14px auto 0;
  font: inherit;
  font-size: 11px;
  border: 0;
  color: #68798e;
  background: none;
  cursor: pointer;
}
.shared-choice {
  font-size: 12px;
  display: flex;
  gap: 8px;
  align-items: start;
}
.shared-choice input {
  accent-color: #587daa;
  margin-top: 5px;
}
.tour-card .tour-missing {
  font-size: 11px;
  color: #68798e;
  margin-bottom: 8px;
}
:global([data-theme='dark'] .tour-card) {
  background: #202b3a;
  color: #e2eaf5;
  border-color: #455975;
}
:global([data-theme='dark'] .tour-card small),
:global([data-theme='dark'] .tour-skip),
:global([data-theme='dark'] .tour-card .tour-missing) {
  color: #b4c7de;
}
:global([data-theme='dark'] .tour-actions button) {
  border-color: #51637c;
}
.tour-card button:focus-visible {
  outline: 2px solid #8fb7e8;
  outline-offset: 3px;
}
@media (max-width: 420px) {
  .tour-card {
    padding: 20px;
  }
  .tour-card h2 {
    font-size: 18px;
  }
  .tour-card p {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
  }
}
</style>

<style scoped>
.tour-legend {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 14px 0;
}
.tour-legend span {
  border-radius: 5px;
  padding: 4px 8px;
  font-size: 10px;
}
.tour-legend strong {
  display: block;
  flex-basis: 100%;
  font-size: 12px;
  color: inherit;
  margin: 6px 0;
  font-weight: 500;
}
</style>
