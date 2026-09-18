// Add this file to the EXISTING Apps Script project. Do not replace doPost.
// Add the routing line shown in the installation guide at the START of doGet.
// Only the first worksheet is read, matching the original API.
// For another worksheet, explicitly set tab to its exact name.
const CHOB_PUBLIC_SOURCES = [
  { id:'1zU7BdQQ2qvCR80ku3WT6YQhu8s9aTCSf3UHLWlhKahc', region:'thailand', official:true },
  { id:'1RSHC9A4T8OvT0XLFCdMbds9Z5ky2GsbLhtDqFhb4Pkw', region:'', official:true },
  { id:'1UvY0Fd5lmgRhPlSdIKn1Clfywo3yU7qcrLTwrRWosuU', region:'thailand', official:true },
  { id:'1HCaeRIunaianxgeyKQceselxyk1IxHzb5k9KBlfMsDA', region:'', official:true },
  { id:'1Irbm_DlW63XjhS54qbopw18WnpJpo_s3gbrDKqkmyvY', region:'thailand', official:false },
  { id:'10S-flnjUlbZzQVBXmHKe7y7tXVfYc3Gg2O6KmSGDjMQ', region:'china', official:false },
  { id:'1H88jEc_anrOW63YsZsxdxb2sdH0mMV0Eemq0iW1Tr-Q', region:'oversea', official:false },
  { id:'1umKIOnnCtnNHRQKQs-O3J9cHvamUZqtu8bY__SvgR3g', region:'thailand', official:false },
  { id:'1gEwDgp7F_ACqWCu7qShCJkhRtMPZusO0USgMdaBTFmo', region:'', official:false }
];
function chobPublicFeed() {
  const output = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  try {
    const data = [];
    CHOB_PUBLIC_SOURCES.forEach((source, sourceIndex) => {
      const label = '数据源 ' + (sourceIndex + 1);
      let values, zone, sheetId;
      try {
        const book = SpreadsheetApp.openById(source.id);
        const sheet = source.tab ? book.getSheetByName(source.tab) : book.getSheets()[0];
        zone = book.getSpreadsheetTimeZone();
        sheetId = sheet.getSheetId();
        values = sheet.getDataRange().getValues();
      } catch (_) { throw new Error(label + '读取失败，请检查表格 ID、工作表名及脚本执行账号的访问权限。'); }
      if (!values.length || values.every(row => row.every(v => v === ''))) return;
      const headers = values[0].map(v => String(v).trim().toLowerCase());
      if (!headers.includes('name') || !headers.some(h => ['date','start_date','sale_date'].includes(h)))
        throw new Error(label + '首行需要 name 和 date/start_date/sale_date 表头。');
      const ids = {};
      values.slice(1).forEach((cells, index) => {
        if (cells.every(v => v === '')) return;
        const row = {};
        headers.forEach((key, i) => {
          const value = cells[i];
          row[key] = value instanceof Date
            ? Utilities.formatDate(value, zone, /(^|_)time$/.test(key) ? 'HH:mm' : 'yyyy-MM-dd')
            : String(value == null ? '' : value).trim();
        });
        const location = label + '第 ' + (index + 2) + ' 行：';
        const regionMap = { thai:'thailand', thailand:'thailand', '泰国':'thailand', '泰国行程':'thailand',
          china:'china', '中国':'china', '中国行程':'china', '来华行程':'china', '来华':'china',
          oversea:'oversea', overseas:'oversea', '海外':'oversea', '海外行程':'oversea' };
        const region = source.region || regionMap[(row.region || row.source || '').toLowerCase()];
        if (!region) throw new Error(location + '请在 region 列填写 china 或 oversea。');
        if (!row.name) throw new Error(location + '缺少 name。');
        const id = row.id || 'row-' + (index + 2);
        if (ids[id]) throw new Error(location + 'id 重复。');
        ids[id] = true;
        const base = { id:source.id + ':' + sheetId + ':' + id, name:row.name, region:region,
          isofficial:source.official === true };
        // Explicit public-field allowlist: never expose user IDs or arbitrary columns.
        ['category','activity','activity_type','time','end_time','time_status','venue','city',
         'type','company','note','contact','contact_method','link','images'].forEach(key => { base[key] = row[key] || ''; });
        base.activity = row.activity || row.title || '';
        base.link = row.link || row.ticket_url || '';
        base.images = row.images || row.image_url || row.picture_urls || '';
        base.contact = row.contact || row.contact_info || '';
        if (row.time === '非公开') { base.time = ''; base.time_status = 'private'; }
        function append(kind, date, end, suffix, extra) {
          if (!chobPublicDate(date) || (end && (!chobPublicDate(end) || end < date)))
            throw new Error(location + '日期须为 YYYY-MM-DD，结束日期不得早于开始日期。');
          data.push(Object.assign({}, base, {id:base.id + suffix, kind:kind, date:date, end_date:end || ''}, extra || {}));
        }
        const date = row.date || row.start_date;
        if (row.kind === 'task') append('task', date || row.sale_date, row.end_date, ':task');
        else {
          if (date) append('event', date, row.end_date, ':event');
          if (row.sale_date) append('task', row.sale_date, row.sale_end_date, ':sale',
            {time:row.sale_time || '', end_time:'', time_status:'', type:row.ticket_type || '抢票', note:row.ticket_note || row.note || ''});
          if (!date && !row.sale_date) throw new Error(location + '缺少日期。');
        }
      });
    });
    return output({success:true, version:'chob-public-v1', data:data, timestamp:new Date().toISOString()});
  } catch (error) {
    return output({success:false, error:'PUBLIC_FEED_ERROR', message:error.message});
  }
}
function chobPublicDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
