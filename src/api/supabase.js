import { configurationProblem } from '../utils/supabaseConfig';
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const demoMode = import.meta.env.VITE_DATA_SOURCE === 'demo';
export const supabase =
  !demoMode && !configurationProblem(url, key) ? createClient(url, key) : null;
export const useSupabaseFeed = import.meta.env.VITE_DATA_SOURCE === 'supabase';
export async function call(name, args = {}, signal) {
  if (!supabase) throw Error('账号服务尚未配置，请联系管理员。');
  const { data, error } = await (signal
    ? supabase.rpc(name, args).abortSignal(signal)
    : supabase.rpc(name, args));
  if (error) throw Error(error.message);
  return data;
}
