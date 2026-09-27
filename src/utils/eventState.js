export function eventState(item) {
  const value = String(item.event_status || item.status || '').toLowerCase();
  const cancelled =
    !!item.cancelled_at ||
    ['cancelled', 'canceled', '已取消', '取消'].includes(value);
  const postponed = ['postponed', 'postpone', '已延期', '延期'].includes(value);
  const pending =
    !!item.pending_verification || (item.pending_fields || []).length > 0;
  return {
    cancelled,
    postponed,
    pending,
    faded: cancelled || postponed || pending,
    label: [
      cancelled ? '已取消' : postponed ? '已延期' : '',
      pending ? '内容待核实' : '',
    ]
      .filter(Boolean)
      .join(' · '),
  };
}
export function dateExplanation(item) {
  if (item.postponed_to_date) return '延期至 ' + item.postponed_to_date;
  if (item.original_date)
    return '原 ' + item.original_date + ' 延期至 ' + item.date;
  return (
    item.date +
    (item.end_date && item.end_date !== item.date ? ' — ' + item.end_date : '')
  );
}
