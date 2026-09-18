<script setup>
import { reactive, ref } from 'vue'
import { useLanguageStore } from '../stores/language'
import { imageUrls } from '../utils/records'
import BaseModal from './BaseModal.vue'
const emit = defineEmits(['close'])
const lang = useLanguageStore()
const companies = [
  '411 Entertainment',
  '9 Arkhan',
  'BEC World',
  'BOXX MUSIC',
  'Bridge Management',
  'CHANGE 2561',
  'Channel 3',
  'Copy A Bangkok',
  'Dee Hup Hous',
  'DoMunDi (DMD)',
  'Genie Records',
  'GMMTV',
  'GNEST',
  'Headliner Thailand',
  'Idol Factory',
  'iQIYIArtist TH',
  'Kicks Records',
  'kiddorecords',
  'LIT Entertainment',
  'LOOKE',
  'LOVEiS Entertainmer',
  'mandee',
  'MchoiceTH',
  'Me Mind Y',
  'ME RECORDS',
  'MILK!',
  'Move Records',
  'Muzik Move',
  'North Star',
  'One 31 (一台)',
  'Open Label (一台)',
  'Smallroom',
  'SONAY MUSIC',
  'Sony Music Thailand',
  'SpicyDisc',
  'Tero Music',
  'TV Thunder',
  'Wabi Sabi',
  'Wayfer Records',
  'What The Duck',
  'White Fox',
  'White Music',
  'XOXO Entertainment',
  '其他个人工作室',
  '洞察娱乐 (Insight)',
  '星猎 (Star Hunter)',
]
const form = reactive(
  Object.fromEntries(
    [
      'name',
      'category',
      'activity',
      'type',
      'date',
      'time',
      'region',
      'city',
      'venue',
      'company',
      'ticket_type',
      'sale_date',
      'sale_time',
      'ticket_url',
      'participation_info',
      'picture_url',
      'note',
    ].map((k) => [k, '']),
  ),
)
const message = ref(''),
  confirming = ref(false)
const key = 'chob-entry-draft-v1'
try {
  const draft = JSON.parse(
    localStorage.getItem(key) || localStorage.getItem('addEventDraft') || 'null',
  )
  if (draft) for (const k of Object.keys(form)) if (typeof draft[k] === 'string') form[k] = draft[k]
  if (draft?.pictures && !form.picture_url) form.picture_url = draft.pictures
} catch {}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(form))
    emit('close')
  } catch {
    message.value = lang.t.draftFailed
  }
}
function requestClose() {
  if (Object.values(form).some((v) => v.trim())) confirming.value = true
  else emit('close')
}
function discard() {
  try {
    localStorage.removeItem(key)
    localStorage.removeItem('addEventDraft')
    emit('close')
  } catch {
    message.value = lang.t.draftFailed
    confirming.value = false
  }
}
defineExpose({ requestClose })
</script>
<template>
  <form class="entry-form" @submit.prevent>
    <div class="entry-fields">
      <label
        >{{ lang.t.artistName }} <em>*</em
        ><input
          v-model="form.name"
          maxlength="200"
          placeholder="e.g. New (GELBOYS) / Ohm (ohmtpk)"
          required
      /></label>
      <label
        >{{ lang.t.category
        }}<select v-model="form.category">
          <option value="">{{ lang.t.choose }}</option>
          <option
            v-for="c in ['bl', 'gl', 'band', 'singer', 'group', 'actor', 'music', 'other']"
            :key="c"
            :value="c"
          >
            {{ lang.t[c] }}
          </option>
        </select></label
      >
      <label
        >{{ lang.t.activityName }} <em>*</em
        ><input v-model="form.activity" maxlength="400" required
      /></label>
      <label
        >{{ lang.t.eventType
        }}<select v-model="form.type">
          <option value="">{{ lang.t.choose }}</option>
          <option
            v-for="(label, k) in {
              brand: '站台活动',
              series: '剧集宣传',
              stage: '舞台演出',
              other: '其他',
            }"
            :key="k"
            :value="label"
          >
            {{ lang.t[k] }}
          </option>
        </select></label
      >
      <label
        >{{ lang.t.dateLabel }} <em>*</em><input v-model="form.date" type="date" required
      /></label>
      <label
        >{{ lang.t.time }}<input v-model="form.time" placeholder="13:00 / 10:00 - 21:00"
      /></label>
      <label
        >{{ lang.t.region }} <em>*</em
        ><select v-model="form.region" required>
          <option value="">{{ lang.t.choose }}</option>
          <option value="thailand">THAILAND</option>
          <option value="china">CHINA</option>
          <option value="oversea">OVERSEA</option>
        </select></label
      >
      <label
        >{{ lang.t.cityLabel }} <em>*</em
        ><input v-model="form.city" :placeholder="lang.t.cityHint" required
      /></label>
      <label>{{ lang.t.venueLabel }}<input v-model="form.venue" /></label>
      <label
        >{{ lang.t.company }}<input v-model="form.company" list="entry-companies" /><datalist
          id="entry-companies"
        >
          <option v-for="c in companies" :key="c" :value="c" /></datalist
        ><small>{{ lang.t.companyHelp }}</small></label
      >
      <label
        >{{ lang.t.participation }} <em>*</em
        ><select v-model="form.ticket_type" required>
          <option value="">{{ lang.t.choose }}</option>
          <option v-for="t in ['buy', 'info', 'from']" :key="t" :value="t">{{ lang.t[t] }}</option>
        </select></label
      >
      <template v-if="['buy', 'from'].includes(form.ticket_type)">
        <label>{{ lang.t.saleDate }}<input v-model="form.sale_date" type="date" /></label>
        <label>{{ lang.t.saleTime }}<input v-model="form.sale_time" type="time" /></label>
        <label
          >{{ lang.t.link
          }}<input v-model="form.ticket_url" type="url" placeholder="https://example.com/tickets"
        /></label>
      </template>
      <label v-if="form.ticket_type === 'info'"
        >{{ lang.t.participationInfo }}<textarea v-model="form.participation_info" rows="3" />
      </label>
      <label
        >{{ lang.t.images
        }}<textarea v-model="form.picture_url" rows="3" :placeholder="lang.t.imageHint" /><small
          >{{ imageUrls(form.picture_url).length }} / 9</small
        ></label
      >
      <label
        >{{ lang.t.noteLabel }}<textarea v-model="form.note" rows="3" maxlength="4000" />
      </label>
      <p class="entry-notice">{{ lang.t.entryDraftNote }}</p>
      <p v-if="message" class="form-error" role="alert">{{ message }}</p>
    </div>
    <div class="entry-actions">
      <button type="button" class="draft-button" @click="save">{{ lang.t.saveDraft }}</button>
      <button type="button" @click="requestClose">{{ lang.t.cancel }}</button>
      <button type="button" class="submit-button" disabled :title="lang.t.submitLater">
        {{ lang.t.submit }}
      </button>
    </div>
  </form>
  <BaseModal v-if="confirming" :title="lang.t.saveDraft" @close="confirming = false">
    <p>{{ lang.t.leaveDraft }}</p>
    <div class="draft-confirm-actions">
      <button class="pill active" @click="save">{{ lang.t.saveDraft }}</button
      ><button class="pill" @click="confirming = false">{{ lang.t.keepEditing }}</button
      ><button class="pill" @click="discard">{{ lang.t.discard }}</button>
    </div>
  </BaseModal>
</template>
