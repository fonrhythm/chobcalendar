export function activeTickerNotices(notices, records, today) {
  const events = new Map(records.filter((r) => r.kind === 'event').map((r) => [r.id, r]));
  return notices.filter((notice) => {
    if (!notice.event_id) return true;
    const event = events.get('supabase:' + notice.event_id);
    if (!event) return false;
    const lastRelevantDate = event.postponed_to_date || event.end_date || event.date;
    return lastRelevantDate >= today;
  });
}
