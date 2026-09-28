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
  issues = ref([{ field: '', value: '' }]),
  fields = computed(() => issues.value.map((i) => i.field).filter(Boolean)),
  details = ref(''),
  message = ref(''),
  busy = ref(false),
  done = ref(false);
const rows = computed(() =>
  data.records.filter((r) => r.kind === 'event' && r.date === date.value),
);
const labels = {
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
};
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
      details:
        issues.value
          .map((i) => `${labels[i.field]}\n正确的内容：${i.value.trim()}`)
          .join('\n\n') +
        '\n\n信息来源：' +
        details.value.trim(),
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
      <fieldset
        v-for="(issue, index) in issues"
        :key="index"
        class="correction-issue"
      >
        <legend>问题 {{ index + 1 }}</legend>
        <label
          >需要纠错的内容<select v-model="issue.field" required>
            <option value="">请选择</option>
            <option
              v-for="(label, key) in labels"
              :key="key"
              :value="key"
              :disabled="
                issues.some((other, i) => i !== index && other.field === key)
              "
            >
              {{ label }}
            </option>
          </select></label
        ><label
          >正确的内容<textarea
            v-model="issue.value"
            required
            maxlength="1000"
            rows="3"
            placeholder="请填写这一项的正确内容"
          ></textarea></label
        ><button
          v-if="issues.length > 1"
          type="button"
          class="text-button"
          @click="issues.splice(index, 1)"
        >
          移除此问题
        </button>
      </fieldset>
      <button
        v-if="issues.length < Object.keys(labels).length"
        type="button"
        class="text-button"
        @click="issues.push({ field: '', value: '' })"
      >
        ＋ 添加一个问题</button
      ><label
        >信息来源
        <textarea
          v-model="details"
          required
          maxlength="4000"
          rows="4"
          placeholder="请附上信息来源的内容链接"
        ></textarea></label
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
