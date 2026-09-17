import { dateKey } from '../utils/dates'
import { normalizeRecord } from '../utils/records'
// Fictional preview data; never substituted for failed live data.
export function demoRecords() {
  const now = new Date(),
    month = dateKey(now).slice(0, 7),
    today = now.getDate(),
    rows = []
  const names = [
    'Gemini Fourth',
    'LingOrm',
    'Tilly Birds',
    'Jeff Satur',
    'LYKN',
    'Namtan Film',
    'PERSES',
    'Zee NuNew',
    'Milk Love',
    'Gawin',
    'BUS',
    'Faye',
  ]
  const cats = [
    'bl',
    'gl',
    'band',
    'singer',
    'group',
    'actor',
    'group',
    'bl',
    'gl',
    'singer',
    'group',
    'gl',
  ]
  for (const region of ['thailand', 'china', 'oversea']) {
    for (let day = 1; day <= new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); day++) {
      const count = day === today ? 5 : day % 6 === 0 ? 0 : 1 + (day % 4)
      for (let i = 0; i < count; i++) {
        const n = (day + i) % names.length
        rows.push({
          id: `${region}-event-${day}-${i}`,
          kind: 'event',
          region,
          name: names[n],
          category:
            region === 'china' && ['band', 'singer', 'group'].includes(cats[n]) ? 'music' : cats[n],
          date: `${month}-${String(day).padStart(2, '0')}`,
          activity: ['Fan Meeting', 'Live Session', 'Brand Event', 'Series Premiere'][i % 4],
          activity_type: ['stage', 'stage', 'brand', 'series'][i % 4],
          time: i === 3 ? '' : `${14 + i}:00`,
          end_time: i === 0 ? '16:00' : '',
          time_status: i === 3 ? 'private' : '',
          company: ['GMMTV', 'Independent', 'DMD'][n % 3],
          venue: region === 'thailand' ? 'Sample Hall' : 'Sample Venue',
          city: region === 'thailand' ? 'Bangkok' : region === 'china' ? 'Shanghai' : 'Singapore',
          type: i % 2 ? 'Online' : 'In person',
          isofficial: i % 3 === 0,
          note: '演示日程 · Fictional preview only.',
        })
      }
    }
    for (let i = 0; i < 4; i++)
      rows.push({
        id: `${region}-task-${i}`,
        kind: 'task',
        region,
        name: names[i],
        category: region === 'china' && i > 1 ? 'music' : cats[i],
        date: month + '-01',
        end_date: month + '-28',
        time: '10:00',
        activity: [
          'Fan Meeting · Ticket Sale',
          'Fan Support · Booking',
          'Live · Table Reservation',
          'Top Spender · Registration',
        ][i],
        activity_type: ['ticket', 'support', 'booking', 'purchase'][i],
        company: ['GMMTV', 'Independent', 'DMD'][i % 3],
        contact: '@sample_contact',
        contact_method: 'Social message',
        note: '演示事项 · Fictional preview only.',
        isofficial: i === 1,
      })
  }
  for (const r of rows) {
    if (r.kind === 'event')
      r.images = [1, 2].map(
        (n) =>
          new URL(import.meta.env.BASE_URL + 'demo/poster-' + n + '.svg', window.location.href)
            .href,
      )
    r.link = 'https://example.com/'
  }
  return rows.map((r, i) => normalizeRecord(r, i, 'demo'))
}
