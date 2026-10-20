import { normalizeClientIp } from '../../miniprogram/worker/src/clientIp.js';

const reply = (status, error, extra = {}) => Response.json({ error }, { status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra } });

// The binding exposes one public feed operation; no incoming headers or URL
// become upstream credentials or a destination for a generic proxy.
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/feed' || url.search) return reply(404, 'Not found');
  if (request.method !== 'POST') return reply(405, 'Method not allowed', { Allow: 'POST' });
  const origin = request.headers.get('Origin');
  if (origin !== null && origin !== url.origin) return reply(403, 'Origin not allowed');
  const ip = normalizeClientIp(request.headers.get('CF-Connecting-IP'));
  if (!ip || typeof env?.CALENDAR_FEED?.getFeed !== 'function') return reply(503, 'Feed temporarily unavailable');
  const length = request.headers.get('Content-Length');
  if (length !== null && !/^\d+$/.test(length)) return reply(400, 'Invalid request');
  if (length !== null && Number(length) > 2048) return reply(413, 'Request too large');
  try {
    let rawBody = '';
    if (request.body) {
      const reader = request.body.getReader();
      let bytes = 0;
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 2048) {
          await reader.cancel();
          return reply(413, 'Request too large');
        }
        chunks.push(value);
      }
      const body = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
      rawBody = new TextDecoder('utf-8', { fatal: true }).decode(body);
    }
    const response = await env.CALENDAR_FEED.getFeed(rawBody, ip);
    return response instanceof Response ? response : reply(503, 'Feed temporarily unavailable');
  } catch { return reply(503, 'Feed temporarily unavailable'); }
}

