<script setup>
import { reactive, ref, computed } from 'vue';
import { call, useSupabaseFeed } from '../api/supabase';
import { useAccountStore } from '../stores/account';
import { useEventsStore } from '../stores/events';
import { useLanguageStore } from '../stores/language';
import { imageUrls } from '../utils/records';
import BaseModal from './BaseModal.vue';
const props = defineProps({ editing: Object });
const emit = defineEmits(['close']);
const data = useEventsStore(),
  account = useAccountStore(),
  selectedArtists = ref([]),
  unmatched = ref(false),
  recurring = ref(false),
  endDate = ref(''),
  busy = ref(false);
const matches = computed(() =>
  data.artistCatalog
    .filter((a) => a.name.toLowerCase().includes(form.name.toLowerCase()))
    .slice(0, 30),
);
async function submit() {
  if (busy.value) return;
  message.value = '';
  try {
    if (!useSupabaseFeed)
      throw Error('新增活动尚未连接新数据源，请联系管理员。');
    if (!account.user) throw Error('请先在个人资料中登录。');
    if (!unmatched.value && !selectedArtists.value.length)
      throw Error('请选择匹配艺人，或勾选没有匹配的艺人。');
    if (
      !imageUrls(form.picture_url).length &&
      !window.confirm('没有填写图片 URL，仍要继续提交吗？')
    )
      return;
    if (
      recurring.value &&
      !window.confirm('每天重复活动将不显示图片，确认提交吗？')
    )
      return;
    busy.value = true;
    await call('chob_submit_event', {
      payload: {
        ...form,
        artist_ids: unmatched.value
          ? []
          : [
              ...new Set(
                selectedArtists.value.flatMap(
                  (id) =>
                    data.artistCatalog.find((a) => a.id === id)?.member_ids || [
                      id,
                    ],
                ),
              ),
            ],
        unmatched_artist: unmatched.value ? form.name : '',
        images: imageUrls(form.picture_url),
        recurring_daily: recurring.value,
        end_date: recurring.value ? endDate.value : '',
        activity_category: form.type,
      },
      record_id: props.editing?.id || null,
      expected_updated_at: props.editing?.updated_at || null,
    });
    localStorage.removeItem(key);
    await data.sync();
    await account.refresh();
    emit('close');
  } catch (e) {
    message.value = e.message;
  } finally {
    busy.value = false;
  }
}
const lang = useLanguageStore();
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
];
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
);
const message = ref(''),
  confirming = ref(false);
const key = 'chob-entry-draft-v1';
try {
  const draft = JSON.parse(
    localStorage.getItem(key) ||
      localStorage.getItem('addEventDraft') ||
      'null',
  );
  if (draft)
    for (const k of Object.keys(form))
      if (typeof draft[k] === 'string') form[k] = draft[k];
  if (draft?.pictures && !form.picture_url) form.picture_url = draft.pictures;
} catch {}
if (props.editing) {
  const e = props.editing;
  Object.assign(form, {
    activity: e.title,
    date: e.date,
    time: e.attributes?.time_text || e.time || '',
    region: e.attributes?.region || '',
    city: e.location_region || '',
    venue: e.location || '',
    company: e.company || '',
    note: e.attributes?.note || '',
    type: e.attributes?.activity_category || 'other',
    picture_url: (e.attributes?.picture_urls || []).join('\n'),
    ticket_url: e.ticket_url || '',
    name: e.attributes?.unmatched_artist || '',
  });
  selectedArtists.value = e.artist_ids || [];
  unmatched.value = !!e.attributes?.unmatched_artist;
  recurring.value = !!e.attributes?.recurring_daily;
  endDate.value = e.attributes?.end_date || '';
}
function save() {
  if (busy.value) return;
  try {
    localStorage.setItem(key, JSON.stringify(form));
    emit('close');
  } catch {
    message.value = lang.t.draftFailed;
  }
}
function requestClose() {
  if (busy.value) return;
  if (Object.values(form).some((v) => v.trim())) confirming.value = true;
  else emit('close');
}
function discard() {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem('addEventDraft');
    emit('close');
  } catch {
    message.value = lang.t.draftFailed;
    confirming.value = false;
  }
}
defineExpose({ requestClose });
</script>
<template>
  <form class="entry-form" @submit.prevent="submit">
    <div class="entry-fields">
      <label
        >{{ lang.t.artistName }} <em>*</em
        ><input
          v-model="form.name"
          maxlength="200"
          placeholder="e.g. New (GELBOYS) / Ohm (ohmtpk)"
          :required="unmatched"
      /></label>
      <label class="profile-artist"
        ><input
          v-model="unmatched"
          type="checkbox"
        />没有匹配的艺人，自行填写</label
      >
      <div v-if="!unmatched" class="artist-match-list">
        <label v-for="a in matches" :key="a.id" class="profile-artist"
          ><input v-model="selectedArtists" type="checkbox" :value="a.id" />{{
            a.name
          }}
          · {{ a.company }}</label
        >
      </div>
      <label
        >{{ lang.t.category
        }}<select v-model="form.category">
          <option value="">{{ lang.t.choose }}</option>
          <option
            v-for="c in [
              'bl',
              'gl',
              'band',
              'singer',
              'group',
              'actor',
              'music',
              'other',
            ]"
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
            v-for="type in data.typeCatalog"
            :key="type.id"
            :value="type.id"
          >
            {{ type.name }}
          </option>
        </select></label
      >
      <label
        >{{ lang.t.dateLabel }} <em>*</em
        ><input v-model="form.date" type="date" required
      /></label>
      <label class="profile-artist"
        ><input
          v-model="recurring"
          type="checkbox"
        />每天重复（不显示图片）</label
      ><label v-if="recurring"
        >结束日期<input v-model="endDate" type="date" :min="form.date" required
      /></label>
      <label
        >{{ lang.t.time
        }}<input v-model="form.time" placeholder="13:00 / 10:00 - 21:00"
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
        ><input
          v-model="form.city"
          placeholder="城市名、线上直播，或填写非公开"
          required
      /></label>
      <label>{{ lang.t.venueLabel }}<input v-model="form.venue" /></label>
      <label
        >{{ lang.t.company
        }}<input v-model="form.company" list="entry-companies" /><datalist
          id="entry-companies"
        >
          <option v-for="c in companies" :key="c" :value="c" /></datalist
        ><small>{{ lang.t.companyHelp }}</small></label
      >
      <label
        >{{ lang.t.participation }} <em>*</em
        ><select v-model="form.ticket_type">
          <option value="">{{ lang.t.choose }}</option>
          <option v-for="t in ['buy', 'info', 'from']" :key="t" :value="t">
            {{ lang.t[t] }}
          </option>
        </select></label
      >
      <template v-if="['buy', 'from'].includes(form.ticket_type)">
        <label
          >{{ lang.t.saleDate }}<input v-model="form.sale_date" type="date"
        /></label>
        <label
          >{{ lang.t.saleTime }}<input v-model="form.sale_time" type="time"
        /></label>
        <label
          >{{ lang.t.link
          }}<input
            v-model="form.ticket_url"
            type="url"
            placeholder="https://example.com/tickets"
        /></label>
      </template>
      <label v-if="form.ticket_type === 'info'"
        >{{ lang.t.participationInfo
        }}<textarea v-model="form.participation_info" rows="3" />
      </label>
      <label
        >{{ lang.t.images
        }}<textarea
          v-model="form.picture_url"
          rows="3"
          :placeholder="lang.t.imageHint"
        /><small>{{ imageUrls(form.picture_url).length }} / 9</small></label
      >
      <label
        >{{ lang.t.noteLabel
        }}<textarea v-model="form.note" rows="3" maxlength="4000" />
      </label>
      <details>
        <summary>复制图片 URL 教程</summary>
        <p>
          打开来源图片，长按或右键选择“复制图片地址”，每行粘贴一条公开图片链接；不能取得时允许留空。
        </p>
      </details>
      <p class="entry-notice">
        提交后直接公开。{{
          editing
            ? `剩余 ${3 - editing.user_edit_count} 次编辑`
            : '提交后可编辑 3 次'
        }}；删除或批量添加请联系 @ChobCalendar。
      </p>
      <p v-if="message" class="form-error" role="alert">{{ message }}</p>
    </div>
    <div class="entry-actions">
      <button type="button" class="draft-button" @click="save">
        {{ lang.t.saveDraft }}
      </button>
      <button type="button" @click="requestClose">{{ lang.t.cancel }}</button>
      <button
        type="submit"
        class="submit-button"
        :disabled="busy || (editing && editing.user_edit_count >= 3)"
      >
        {{ lang.t.submit }}
      </button>
    </div>
  </form>
  <BaseModal
    v-if="confirming"
    :title="lang.t.saveDraft"
    @close="confirming = false"
  >
    <p>{{ lang.t.leaveDraft }}</p>
    <div class="draft-confirm-actions">
      <button class="pill active" @click="save">{{ lang.t.saveDraft }}</button
      ><button class="pill" @click="confirming = false">
        {{ lang.t.keepEditing }}</button
      ><button class="pill" @click="discard">{{ lang.t.discard }}</button>
    </div>
  </BaseModal>
</template>
