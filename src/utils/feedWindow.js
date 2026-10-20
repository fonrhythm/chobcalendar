import {addDays,dateKey,parseDate} from './dates.js';
export function feedWindow(month){const first=month+'-01',next=parseDate(first);next.setMonth(next.getMonth()+1);return {start:addDays(first,-7),end:addDays(dateKey(next),6)}}
function abortError() { const error = new Error('读取已取消。'); error.name = 'AbortError'; return error; }
function timeoutError() { const error = new Error('读取超时，请稍后重试。'); error.name = 'TimeoutError'; return error; }

function readPage(call, args, parent, timeoutMs, setTimer, clearTimer) {
  if (parent?.aborted) return Promise.reject(abortError());
  const controller = new AbortController();
  let timer, cancel;
  const interrupted = new Promise((_, reject) => {
    cancel = () => { controller.abort(); reject(abortError()); };
    parent?.addEventListener('abort', cancel, { once: true });
    timer = setTimer(() => { controller.abort(); reject(timeoutError()); }, timeoutMs);
  });
  return Promise.race([Promise.resolve().then(() => call('chob_public_feed', args, controller.signal)), interrupted])
    .finally(() => { clearTimer(timer); parent?.removeEventListener('abort', cancel); });
}

export function createFeedPageLoader(call, { now = Date.now, setTimer = setTimeout,
  clearTimer = clearTimeout, pageTimeoutMs = 30000, requestBudgetMs = 120000,
  maxPages = 20, progressTtlMs = 300000 } = {}) {
  const progress = new Map();
  async function load(args, signal) {
    const key = JSON.stringify(args), started = now();
    for (const [savedKey, value] of progress) if (now() - value.at > progressTtlMs) progress.delete(savedKey);
    let state = progress.get(key);
    if (!state) {
      state = { page: 0, pages: 0, at: now(), records: [], artists: new Map(), notices: new Map() };
      progress.set(key, state);
    }
    while (state.pages < maxPages) {
      if (signal?.aborted) throw abortError();
      const remaining = requestBudgetMs - (now() - started);
      if (remaining <= 0) throw timeoutError();
      const feed = await readPage(call, { ...args, page: state.page }, signal,
        Math.min(pageTimeoutMs, remaining), setTimer, clearTimer);
      if (signal?.aborted) throw abortError();
      if (!Array.isArray(feed?.records) || feed.artists != null && !Array.isArray(feed.artists)
        || feed.announcements != null && !Array.isArray(feed.announcements)) throw Error('日历数据格式无效，请稍后重试。');
      const next = feed.next_page;
      if (next != null && (!Number.isSafeInteger(next) || next <= state.page)) throw Error('日历分页响应无效');
      state.records.push(...feed.records);
      for (const artist of feed.artists || []) state.artists.set(artist.id, artist);
      for (const notice of feed.announcements || []) state.notices.set(notice.id, notice);
      state.types = feed.types;
      state.conditions = feed.conditions;
      state.pages++;
      state.at = now();
      if (next == null) {
        progress.delete(key);
        return { records: state.records, artists: [...state.artists.values()],
          announcements: [...state.notices.values()], types: state.types, conditions: state.conditions };
      }
      state.page = next;
    }
    throw Error('当前日期范围活动过多，请缩小范围。');
  }
  return { load };
}

export function loadFeedPages(call, args, signal) {
  return createFeedPageLoader(call).load(args, signal);
}
