<script setup>
import { reactive, ref } from 'vue'
import { useLanguageStore } from '../stores/language'
import { useViewStore } from '../stores/view'
import { imageUrls } from '../utils/records'
const lang = useLanguageStore(),
  view = useViewStore()
const form = reactive({
  name: '',
  region: view.currentRegion,
  category: 'other',
  kind: 'event',
  activity: '',
  type: '站台活动',
  date: view.selectedDate,
  end_date: '',
  time: '',
  end_time: '',
  venue: '',
  city: '',
  company: '',
  price: '',
  note: '',
  sale_date: '',
  sale_time: '',
  ticket_url: '',
  contact: '',
  picture_url: '',
})
const saved = ref(false),
  message = ref('')
try {
  const draft = JSON.parse(localStorage.getItem('chob-entry-draft-v1') || 'null')
  if (draft)
    for (const key of Object.keys(form)) if (typeof draft[key] === 'string') form[key] = draft[key]
} catch {}
function save() {
  message.value = ''
  if (form.end_date && form.date && form.end_date < form.date) {
    message.value = lang.t.dateOrder
    return
  }
  try {
    localStorage.setItem('chob-entry-draft-v1', JSON.stringify(form))
    saved.value = true
  } catch {
    message.value = lang.t.draftFailed
  }
}
</script>
<template>
  <form class="entry-form" @submit.prevent="save" @input="saved = false">
    <p class="entry-notice">{{ lang.t.entryDraftNote }}</p>
    <div class="entry-fields">
      <label class="full"
        >{{ lang.t.artistName }}<input v-model="form.name" maxlength="200" required
      /></label>
      <label
        >{{ lang.t.region
        }}<select v-model="form.region">
          <option value="thailand">THAILAND</option>
          <option value="china">CHINA</option>
          <option value="oversea">OVERSEA</option>
        </select></label
      >
      <label
        >{{ lang.t.category
        }}<select v-model="form.category">
          <option
            v-for="cat in ['bl', 'gl', 'band', 'singer', 'group', 'actor', 'music', 'other']"
            :key="cat"
            :value="cat"
          >
            {{ lang.t[cat] }}
          </option>
        </select></label
      >
      <label class="full"
        >{{ lang.t.activityName }}<input v-model="form.activity" maxlength="400"
      /></label>
      <label
        >{{ lang.t.entryKind
        }}<select v-model="form.kind">
          <option value="event">{{ lang.t.calendar }}</option>
          <option value="task">{{ lang.t.task }}</option>
        </select></label
      >
      <label
        >{{ lang.t.eventType
        }}<select v-model="form.type">
          <option
            v-for="(label, key) in {
              brand: '站台活动',
              series: '剧集宣传',
              stage: '舞台演出',
              other: '其他',
            }"
            :key="key"
            :value="label"
          >
            {{ lang.t[key] }}
          </option>
        </select></label
      >
      <label>{{ lang.t.startDate }}<input v-model="form.date" type="date" required /></label>
      <label
        >{{ lang.t.endDate }}<input v-model="form.end_date" type="date" :min="form.date"
      /></label>
      <label>{{ lang.t.startTime }}<input v-model="form.time" type="time" /></label>
      <label>{{ lang.t.endTime }}<input v-model="form.end_time" type="time" /></label>
      <label>{{ lang.t.venueLabel }}<input v-model="form.venue" maxlength="300" /></label>
      <label
        >{{ lang.t.cityLabel
        }}<input v-model="form.city" maxlength="100" :placeholder="lang.t.cityHint"
      /></label>
      <label>{{ lang.t.company }}<input v-model="form.company" maxlength="150" /></label>
      <label>{{ lang.t.priceLabel }}<input v-model="form.price" maxlength="100" /></label>
      <label>{{ lang.t.saleDate }}<input v-model="form.sale_date" type="date" /></label>
      <label>{{ lang.t.saleTime }}<input v-model="form.sale_time" type="time" /></label>
      <label class="full">{{ lang.t.link }}<input v-model="form.ticket_url" type="url" /></label>
      <label class="full"
        >{{ lang.t.contact }}<input v-model="form.contact" maxlength="250"
      /></label>
      <label class="full"
        >{{ lang.t.images
        }}<textarea v-model="form.picture_url" rows="3" :placeholder="lang.t.imageHint"></textarea
        ><small>{{ imageUrls(form.picture_url).length }} / 9</small></label
      >
      <label class="full"
        >{{ lang.t.noteLabel }}<textarea v-model="form.note" rows="3" maxlength="4000"></textarea>
      </label>
    </div>
    <p v-if="message" class="form-error" role="alert">{{ message }}</p>
    <p v-if="saved" role="status">{{ lang.t.draftSaved }}</p>
    <div class="entry-actions">
      <button class="pill active" type="submit">{{ lang.t.saveDraft }}</button
      ><button class="pill" type="button" disabled>{{ lang.t.submitLater }}</button>
    </div>
  </form>
</template>
