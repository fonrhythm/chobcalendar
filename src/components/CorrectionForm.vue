<script setup>
import { ref, computed } from 'vue';
import { call } from '../api/supabase';
import { useAccountStore } from '../stores/account';
import { useEventsStore } from '../stores/events';
const props = defineProps({ item: Object }),
  emit = defineEmits(['close']),
  data = useEventsStore(),
  account = useAccountStore();
const date = ref(props.item?.date || ''),
  target = ref(props.item?.id || ''),
  fields = ref([]),
  details = ref(''),
  message = ref(''),
  busy = ref(false),
  done = ref(false);
const rows = computed(() =>
  data.records.filter((r) => r.kind === 'event' && r.date === date.value),
);
async function submit() {
  busy.value = true;
  message.value = '';
  try {
    if (!account.user) throw Error('请先在个人资料中登录。');
    if (!target.value.startsWith('supabase:'))
      throw Error('此活动尚未迁入新数据源，请联系管理员。');
    await call('chob_report_correction', {
      target: target.value.slice(9),
      field_names: fields.value,
      details: details.value,
    });
    done.value = true;
    message.value = '已通知管理员核对，谢谢你的提醒';
    await data.sync();
  } catch (e) {
    message.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <form class="account-form" @submit.prevent="submit">
    <template v-if="!done"
      ><label
        >需要纠错的活动日期<input
          v-model="date"
          type="date"
          required
          @change="target = ''" /></label
      ><label
        >需要纠错的活动<select v-model="target" required>
          <option value="">请选择</option>
          <option v-for="r in rows" :key="r.id" :value="r.id">
            {{ r.name }} · {{ r.activity }}
          </option>
        </select></label
      >
      <fieldset>
        <legend>需要纠错的内容</legend>
        <label
          v-for="(label, key) in {
            name: '艺人',
            activity: '活动名称',
            date: '日期',
            time: '时间',
            venue: '地点',
            city: '城市',
            company: '公司',
            note: '备注',
            images: '图片',
            link: '来源链接',
          }"
          :key="key"
          class="profile-artist"
          ><input v-model="fields" type="checkbox" :value="key" />{{
            label
          }}</label
        >
      </fieldset>
      <textarea
        v-model="details"
        required
        maxlength="4000"
        rows="4"
        placeholder="说明哪里有误，并附上你看到的资料来源"
      ></textarea
      ><button class="pill active" :disabled="busy || !fields.length">
        {{ busy ? '提交中…' : '提交纠错' }}
      </button></template
    >
    <p v-if="message" role="status">{{ message }}</p>
    <button v-if="done" type="button" class="pill" @click="emit('close')">
      返回活动
    </button>
  </form>
</template>
