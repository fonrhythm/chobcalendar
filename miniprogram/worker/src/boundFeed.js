import feed from './feed.js';
import { normalizeClientIp } from './clientIp.js';

const reply = (status, error) => Response.json({ error }, { status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

// This RPC accepts public query JSON only. It has no URL, headers or RPC target.
export async function getBoundFeed(rawBody, clientIp, env) {
  const ip = normalizeClientIp(clientIp);
  if (!ip) return reply(503, 'Feed temporarily unavailable');
  if (typeof rawBody !== 'string') return reply(400, 'Invalid parameters');
  if (new TextEncoder().encode(rawBody).byteLength > 2048) return reply(413, 'Request too large');
  try {
    const request = new Request('https://chobcalendar.pages.dev/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://chobcalendar.pages.dev' },
      body: rawBody,
    });
    return await feed.fetch(request, env, undefined, ip);
  } catch { return reply(503, 'Feed temporarily unavailable'); }
}
