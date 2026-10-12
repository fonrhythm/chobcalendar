import { configurationProblem } from '../utils/supabaseConfig';
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const demoMode = import.meta.env.VITE_DATA_SOURCE === 'demo';
export const supabase =
  !demoMode && !configurationProblem(url, key) ? createClient(url, key) : null;
export const useSupabaseFeed = import.meta.env.VITE_DATA_SOURCE === 'supabase';
export async function call(name, args = {}, signal) {
  if (name === 'chob_public_feed') {
    const endpoint = import.meta.env.VITE_PUBLIC_FEED_URL;
    if (!endpoint) throw Error('日历数据服务尚未配置，请联系管理员。');
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args), signal, credentials: 'omit',
    });
    if (!response.ok) throw Error(response.status === 429
      ? '请求过于频繁，请稍后再试。' : '日历数据暂时无法加载，请稍后再试。');
    return response.json();
  }
  if (!supabase) throw Error('账号服务尚未配置，请联系管理员。');
  const { data, error } = await (signal
    ? supabase.rpc(name, args).abortSignal(signal)
    : supabase.rpc(name, args));
  if (error) throw Error(error.message);
  return data;
}
