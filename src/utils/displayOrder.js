const names = new Intl.Collator('zh-CN-u-co-pinyin', {
  sensitivity: 'base', numeric: true, ignorePunctuation: true,
});
export function compareDisplayOrder(a, b) {
  return Number(b.prefer_activity_name === true) - Number(a.prefer_activity_name === true)
    || names.compare(String(a.name || '').trim(), String(b.name || '').trim())
    || String(a.time || '').localeCompare(String(b.time || ''))
    || String(a.id).localeCompare(String(b.id));
}
