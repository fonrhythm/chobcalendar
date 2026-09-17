/**
 * CHOB public read-only feed. Copy into Google Apps Script.
 * Configure Script Properties:
 * CHOB_SOURCES = [{"id":"YOUR_SPREADSHEET_ID","tab":"events","kind":"event","region":"thailand","official":false}]
 * Each source contains PUBLIC data only. official is assigned here, never trusted from a row.
 * Only administrators may edit this script, its properties, and official source sheets.
 */
function doGet() {
  try {
    const sources = JSON.parse(PropertiesService.getScriptProperties().getProperty('CHOB_SOURCES') || '[]');
    if (!Array.isArray(sources) || !sources.length) throw new Error('Configure CHOB_SOURCES');
    const cache = CacheService.getScriptCache();
    const cacheKey = 'feed-v2-' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(sources)));
    const cached = cache.get(cacheKey);
    if (cached) return jsonText(cached);
    const data = [];
    const ids = {};
    sources.forEach(function(source) {
      const book = SpreadsheetApp.openById(source.id);
      const sheet = book.getSheetByName(source.tab);
      if (!sheet) throw new Error('Missing sheet');
      const values = sheet.getDataRange().getDisplayValues();
      if (!values.length) return;
      const headers = values[0].map(function(h) { return h.trim(); });
      ['id', 'name'].forEach(function(key) { if (headers.indexOf(key) < 0) throw new Error('Missing column ' + key); });
      if (headers.indexOf('date') < 0 && headers.indexOf('start_date') < 0) throw new Error('Missing date column');
      const fields = ['name','date','start_date','end_date','activity','activity_type','category','time','start_time','end_time','time_status','venue','city','type','company','note','description','contact','contact_method','link','images'];
      values.slice(1).forEach(function(row, index) {
        if (row.every(function(v) { return v === ''; })) return;
        const raw = {};
        headers.forEach(function(h, i) { raw[h] = row[i]; });
        if (!raw.id || !raw.name) throw new Error('Missing ID or name at row ' + (index + 2));
        const item = {};
        fields.forEach(function(k) { if (raw[k] !== undefined) item[k] = raw[k]; });
        item.id = source.id + '/' + source.tab + '/' + raw.id;
        if (ids[item.id]) throw new Error('Duplicate ID');
        ids[item.id] = true;
        item.region = source.region;
        item.kind = source.kind === 'task' ? 'task' : 'event';
        item.isofficial = source.official === true;
        data.push(item);
      });
    });
    const output = JSON.stringify({ success: true, updated_at: new Date().toISOString(), data: data });
    // Cache entries are size-limited; a large feed is still returned without caching.
    try { cache.put(cacheKey, output, 60); } catch (ignored) {}
    return jsonText(output);
  } catch (error) {
    console.error(error);
    return jsonText(JSON.stringify({ success: false, message: 'Calendar data unavailable' }));
  }
}
function jsonText(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
