// One active calendar window, with a shared server cooldown and a single retry.
export function createFeedSync({ load, now = Date.now, setTimer = setTimeout,
  clearTimer = clearTimeout, minSyncIntervalMs = 60000,
  onStart = () => {}, onSuccess = () => {}, onError = () => {} }) {
  const completed = new Map();
  let activeKey = '', activeArgs, activePromise, controller, revision = 0;
  let retryTimer, blockedUntil = 0;
  const clearRetry = () => { if (retryTimer !== undefined) clearTimer(retryTimer); retryTimer = undefined; };
  function scheduleRetry() {
    if (retryTimer !== undefined) return;
    retryTimer = setTimer(() => {
      retryTimer = undefined;
      sync(activeArgs);
    }, Math.max(1, blockedUntil - now()));
  }
  function sync(args, { force = false } = {}) {
    const key = JSON.stringify(args);
    const changed = activeKey !== key;
    if (!changed && activePromise) return activePromise;
    if (changed) {
      controller?.abort();
      clearRetry();
      activePromise = undefined;
      ++revision;
      activeKey = key;
      activeArgs = args;
    }
    if (now() < blockedUntil) {
      scheduleRetry();
      return Promise.resolve({ cooldown: true, retryAt: blockedUntil });
    }
    const saved = completed.get(key);
    if (!force && saved && now() - saved.at < minSyncIntervalMs) {
      if (changed) {
        try { onSuccess(saved.feed, { cached: true, args }); }
        catch (error) {
          completed.delete(key);
          onError(error);
          return Promise.resolve({ error });
        }
      }
      return Promise.resolve({ skipped: true });
    }
    clearRetry();
    controller = new AbortController();
    const signal = controller.signal, current = ++revision;
    onStart();
    const run = (async () => {
      try {
        const feed = await Promise.resolve().then(() => load(args, signal));
        if (current !== revision || signal.aborted) return { cancelled: true };
        onSuccess(feed, { cached: false, args });
        completed.set(key, { at: now(), feed });
        if (completed.size > 6) completed.delete(completed.keys().next().value);
        return { feed };
      } catch (error) {
        if (current !== revision || signal.aborted) return { cancelled: true };
        completed.delete(key);
        if (error.status === 429) {
          blockedUntil = Math.max(blockedUntil, Number(error.retryAt) || now() + 60000);
          if (blockedUntil <= now()) blockedUntil = now() + 1000;
          scheduleRetry();
        }
        onError(error);
        return { error };
      } finally {
        if (current === revision) activePromise = undefined;
      }
    })();
    activePromise = run;
    return run;
  }
  function cancel() {
    ++revision;
    controller?.abort();
    clearRetry();
    activePromise = undefined;
    activeKey = '';
  }
  return { sync, cancel };
}
