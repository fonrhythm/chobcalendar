export function feedHttpError(status, retryAt = 0) {
  const error = new Error(status === 429
    ? '请求较多，稍后会自动继续同步。'
    : '日历数据暂时无法加载，请稍后再试。');
  error.status = status;
  error.retryAt = retryAt;
  return error;
}

export function retryAfterTime(value, now = Date.now()) {
  if (value != null && String(value).trim() !== '') {
    const seconds = Number(value);
    const time = Number.isFinite(seconds) ? now + seconds * 1000 : Date.parse(value);
    if (Number.isFinite(time)) return Math.max(now + 1000, time);
  }
  return now + 60000;
}

export function createPublicFeedClient({ endpoint, fetcher = fetch, now = Date.now, cacheMs = 30000 }) {
  let blockedUntil = 0;
  const pending = new Map(), cache = new Map();
  return async function read(args = {}, signal) {
    const key = JSON.stringify(args);
    const cacheable = !signal && !args.start && !args.end;
    const saved = cacheable && cache.get(key);
    if (saved && now() - saved.at < cacheMs) return saved.value;
    if (cacheable && pending.has(key)) return pending.get(key);
    if (now() < blockedUntil) throw feedHttpError(429, blockedUntil);
    const request = (async () => {
      const response = await fetcher(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args), signal, credentials: 'omit',
      });
      if (!response.ok) {
        if (response.status === 429) blockedUntil = Math.max(blockedUntil,
          retryAfterTime(response.headers?.get('Retry-After'), now()));
        throw feedHttpError(response.status, response.status === 429 ? blockedUntil : 0);
      }
      const value = await response.json();
      if (args.start || args.end) cache.clear();
      if (cacheable) {
        if (cache.size >= 100) cache.delete(cache.keys().next().value);
        cache.set(key, { value, at: now() });
      }
      return value;
    })();
    if (cacheable) pending.set(key, request);
    try { return await request; }
    finally { if (pending.get(key) === request) pending.delete(key); }
  };
}
