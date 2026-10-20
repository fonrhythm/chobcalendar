# Mobile calendar synchronization

The production Pages build uses `VITE_PUBLIC_FEED_URL=/api/feed`. Its Pages Function has a `CALENDAR_FEED` service binding to `chobcalendar-wechat`, named entrypoint `CalendarFeed` (production environment). Deploy the Worker before deploying a Pages build that uses this binding. Other hosts may retain their existing absolute feed URL.

The Pages Function accepts only bounded POST JSON queries. It reads the platform's `CF-Connecting-IP`, normalizes it, and calls `CalendarFeed.getFeed(rawBody, clientIp)` through the internal service binding. It does not forward client credentials, cookies, arbitrary URLs, or arbitrary RPC names. The default public Worker HTTP route reads only its edge-provided client IP; it never trusts caller-supplied proxy headers or JSON IP fields. Both paths use the same existing `FEED_LIMITER` namespace and `feed:<IP>` key.

The gateway still restricts each request to 62 days and 150 records per page, at most 20 pages. The per-IP quota remains 10 requests per minute. Supabase public RPC and direct-table restrictions remain in place.

The client avoids repeated automatic sync of a recently completed calendar window, keeps completed pages for retries, and waits for a 429 cooldown before resuming the failed page. It does not mark partial results as synchronized. Failed or canceled pages do not overwrite a newer month. Detail/search reads have a short in-memory cache and share identical in-flight requests. Explicit refresh remains available, subject to the server cooldown.

Initial investigation found three calendar pages and 356 records for the October window. Mobile-like API probes returned 200 with correct CORS; a short live trace showed successful responses and one cancellation, without capturing the phone's exact failed request. Independently reproducible issues were repeated foreground sync exhausting the quota and loss of page progress after failure. The same-origin route also removes the browser's extra cross-origin request dependency; it does not reopen the database or increase the quota.
