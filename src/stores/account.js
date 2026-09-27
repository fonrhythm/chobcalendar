import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase, call } from '../api/supabase';
import { useEventsStore } from './events';
export const useAccountStore = defineStore('account', () => {
  const user = ref(null),
    profile = ref(null),
    nickname = ref(''),
    tags = ref({}),
    messages = ref([]),
    submissions = ref([]),
    error = ref(''),
    ready = ref(false),
    busy = ref(false);
  const admin = computed(
    () =>
      profile.value?.role === 'admin' &&
      profile.value?.is_active &&
      profile.value?.email_verified,
  );
  let init = false,
    sequence = 0;
  async function load(session) {
    const seq = ++sequence;
    ready.value = false;
    user.value = session?.user || null;
    profile.value = null;
    messages.value = [];
    submissions.value = [];
    error.value = '';
    nickname.value = '';
    tags.value = {};
    if (!user.value) {
      ready.value = true;
      return;
    }
    const uid = user.value.id;
    const local = useEventsStore();
    local.favorites = [];
    local.favoriteArtists = [];
    local.myItems = [];
    try {
      const [p, s, m, e] = await Promise.all([
        supabase
          .from('users')
          .select('role,is_active,email_verified,nickname')
          .eq('id', uid)
          .single(),
        supabase.from('chob_personal').select('*').eq('id', uid).maybeSingle(),
        supabase
          .from('chob_messages')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
        supabase.rpc('chob_my_submissions'),
      ]);
      if (seq !== sequence) return;
      for (const result of [p, s, m, e]) if (result.error) throw result.error;
      profile.value = p.data;
      nickname.value = s.data?.nickname || p.data?.nickname || '';
      tags.value = s.data?.tags || {};
      messages.value = m.data || [];
      submissions.value = e.data || [];
      const events = useEventsStore();
      events.favorites = s.data?.favorites || [];
      events.favoriteArtists = s.data?.artist_favorites || [];
      events.myItems = s.data?.items || [];
      ready.value = true;
    } catch (e) {
      if (seq === sequence)
        error.value = '账号资料加载失败，请重试：' + e.message;
    }
  }
  async function initialize() {
    if (init || !supabase) return;
    init = true;
    const { data } = await supabase.auth.getSession();
    await load(data.session);
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || session?.user?.id !== user.value?.id)
        setTimeout(() => load(session), 0);
    });
  }
  async function login(email, password) {
    error.value = '';
    const { data, error: problem } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (problem) throw Error(problem.message);
    await load(data.session);
  }
  async function register(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw Error(error.message);
  }
  async function logout() {
    await supabase.auth.signOut();
    const events = useEventsStore();
    events.favorites = [];
    events.favoriteArtists = [];
    events.myItems = [];
    await load(null);
  }
  async function save() {
    if (!user.value) return;
    if (!ready.value) throw Error('账号资料尚未加载完成，请重试后再保存。');
    const events = useEventsStore();
    await call('chob_save_personal', {
      payload: {
        nickname: nickname.value,
        favorites: events.favorites,
        artist_favorites: events.favoriteArtists,
        items: events.myItems,
        tags: tags.value,
      },
    });
  }
  async function refresh() {
    const { data } = await supabase.auth.getSession();
    await load(data.session);
  }
  return {
    user,
    profile,
    nickname,
    tags,
    messages,
    submissions,
    error,
    ready,
    busy,
    admin,
    initialize,
    login,
    register,
    logout,
    save,
    refresh,
    configured: !!supabase,
  };
});
