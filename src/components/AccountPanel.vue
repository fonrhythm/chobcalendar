<script setup>
import { ref, computed } from 'vue';
import { useAccountStore } from '../stores/account';
import { useEventsStore } from '../stores/events';
const props = defineProps({ initialMode: { type: String, default: 'login' } });
const emit = defineEmits(['edit', 'open']),
  account = useAccountStore(),
  data = useEventsStore(),
  email = ref(''),
  password = ref(''),
  mode = ref(props.initialMode),
  message = ref(''),
  working = ref(false),
  artistKind = ref('all');
const artists = computed(() =>
  data.artistCatalog.filter(
    (a) =>
      artistKind.value === 'all' ||
      (artistKind.value === 'person'
        ? !a.group_kind && !(a.categories || []).includes('CP')
        : artistKind.value === 'cp'
          ? (a.categories || []).includes('CP')
          : a.group_kind === artistKind.value),
  ),
);
async function auth() {
  if (working.value) return;
  working.value = true;
  message.value = '';
  try {
    if (mode.value === 'login')
      await account.login(email.value, password.value);
    else {
      await account.register(email.value, password.value);
      message.value = '请检查邮箱，完成验证后登录。';
    }
  } catch (e) {
    message.value = e.message;
  } finally {
    working.value = false;
  }
}
async function verifyEmail() {
  if(working.value) return; working.value=true; message.value='';
  try {await account.resendVerification(account.user?.email || email.value); message.value='如果此邮箱需要验证，将收到验证邮件。请检查收件箱和垃圾邮件，完成验证后再登录。';} catch(e) {message.value=e.message;} finally {working.value=false;}
}
async function googleLogin() {
  if(working.value) return; working.value=true; message.value='';
  try { await account.loginGoogle(); } catch(e) { message.value=e.message; } finally { working.value=false; }
}
async function save() {
  working.value = true;
  try {
    await account.save();
    message.value = '已保存';
  } catch (e) {
    message.value = e.message;
  } finally {
    working.value = false;
  }
}
</script>
<template>
  <section class="account-panel">
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="account.error" role="alert">
      {{ account.error }} <button @click="account.refresh">重试</button>
    </p>
    <template v-if="!account.user"
      ><p v-if="!account.configured">账号服务尚未配置。</p>
      <div v-else><button type="button" class="pill" :disabled="working" @click="googleLogin">使用 Google 登录</button>
      <form @submit.prevent="auth" class="account-form">
        <label
          >邮箱<input
            v-model="email"
            type="email"
            autocomplete="email"
            required /></label
        ><label
          >密码<input
            v-model="password"
            type="password"
            :autocomplete="
              mode === 'login' ? 'current-password' : 'new-password'
            "
            required
            :minlength="mode === 'register' ? 8 : undefined" /></label
        ><button class="pill active" :disabled="working">
          {{ mode === 'login' ? '登录' : '注册' }}</button
        ><button
          type="button"
          class="text-button"
          @click="mode = mode === 'login' ? 'register' : 'login'"
        >
          {{ mode === 'login' ? '注册账号' : '返回登录' }}
        </button>
      <button type="button" class="text-button" :disabled="working" @click="verifyEmail">重新发送验证邮件</button>
      </form></div></template
    ><template v-else-if="account.ready"
      ><h2>个人中心</h2><div v-if="!account.profile?.email_verified" role="status"><p>账号已保留。完成邮箱验证后即可保存资料、收藏和提交内容。</p><button class="pill" :disabled="working" @click="verifyEmail">发送验证邮件</button><button class="text-button" @click="account.refresh">刷新资料</button></div><p class="muted">个人资料和记录不会公开展示。</p>
      <label>简介<textarea v-model="account.bio" maxlength="500" /></label>
      <label>昵称<input v-model="account.nickname" maxlength="100" /></label
      ><button class="pill" :disabled="working" @click="save">保存资料</button
      ><button class="text-button" @click="account.logout">退出登录</button>
      <h3>收藏艺人</h3>
      <select v-model="artistKind">
        <option value="all">全部</option>
        <option value="person">个人艺人</option>
        <option value="cp">CP</option>
        <option value="group">组合</option>
        <option value="band">乐队</option>
      </select>
      <div class="profile-artists">
        <label v-for="a in artists" :key="a.id" class="profile-artist"
          ><input
            type="checkbox"
            :checked="data.favoriteArtists.includes(a.id)"
            @change="data.toggleArtist(a.id)"
          />{{ a.name }}<small>{{ a.company }}</small></label
        >
      </div>
      <h3>收藏活动</h3>
      <button
        v-for="row in data.records.filter((r) => data.favorites.includes(r.id))"
        :key="row.id"
        class="task-row"
        @click="data.toggleFavorite(row.id)"
      >
        <span>{{ row.name }} · {{ row.date }}</span
        ><span>移除</span>
      </button>
      <h3>我提交的活动</h3>
      <div v-for="row in account.submissions" :key="row.id" class="task-row">
        <span>{{ row.title }} · {{ row.date }} · {{ ({pending:'待审核',published:'已发布',rejected:'未通过',draft:'草稿'})[row.status] || row.status }}</span
        ><button
          :disabled="row.user_edit_count >= 3"
          @click="emit('edit', row)"
        >
          编辑（剩 {{ 3 - row.user_edit_count }} 次）
        </button>
      </div>
      <p class="muted">删除活动请联系管理员 @ChobCalendar。</p>
      <h3>我的纠错</h3>
      <article v-for="item in account.corrections" :key="item.id" class="message-card"><p>{{ item.content }}</p><p>{{ ({pending:'待处理',resolved:'已处理',rejected:'未采纳'})[item.status] || item.status }}</p><p v-if="item.reply">回复：{{ item.reply }}</p></article>
      <p v-if="!account.corrections.length" class="muted">暂无纠错记录</p>
      <h3>站内消息</h3>
      <article v-for="m in account.messages" :key="m.id" class="message-card">
        <p>{{ m.content }}</p>
        <button
          v-if="data.records.some((r) => r.id === 'supabase:' + m.event_id)"
          class="text-button"
          @click="
            emit(
              'open',
              data.records.find((r) => r.id === 'supabase:' + m.event_id),
            )
          "
        >
          查看活动变动 →
        </button>
      </article>
      <p v-if="!account.messages.length" class="muted">暂无消息</p></template
    >
  </section>
</template>

<style scoped>
textarea{width:100%;min-height:80px}
</style>
