export const TASK_TYPES = [
  { value: 'ticketing', label: '开票' },
  { value: 'registration', label: '填表' },
  { value: 'shopping', label: '消费' },
  { value: 'other', label: '其他' },
];
export function taskCategory(value) {
  return (
    {
      shopping: 'shopping',
      消费: 'shopping',
      购物: 'shopping',
      registration: 'registration',
      填表: 'registration',
      报名: 'registration',
      ticketing: 'ticketing',
      开票: 'ticketing',
      购票: 'ticketing',
      booking: 'other',
      notification: 'other',
      other: 'other',
    }[value] || 'other'
  );
}
