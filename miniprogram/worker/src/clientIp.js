// The value comes from the edge or a trusted service binding, never user JSON.
export function normalizeClientIp(value) {
  if (typeof value !== 'string' || !value.length || value.length > 45 || !/^[0-9a-fA-F:.]+$/.test(value)) return '';
  if (!value.includes(':')) {
    const parts = value.split('.');
    return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)
      ? parts.map(Number).join('.') : '';
  }
  try {
    const host = new URL('http://[' + value + ']/').hostname;
    return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : '';
  } catch { return ''; }
}
