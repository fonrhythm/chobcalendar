import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { normalizeRecord } from '../src/utils/records.js';
import { richTextHtml, richTextForText } from '../src/utils/richText.js';

const miniRoot = fileURLToPath(new URL('../miniprogram/client/', import.meta.url));
const base = { id: 'event', name: 'Artist', date: '2026-10-21', region: 'thailand' };
const doc = (text, style = {}) => ({ version: 1, blocks: [{ type: 'p', runs: [{ text, ...style }] }] });
const copy = value => JSON.parse(JSON.stringify(value));
function miniModule(file, cache = new Map()) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const module = { exports: {} }; cache.set(absolute, module);
  vm.runInNewContext(fs.readFileSync(absolute, 'utf8'), { module, exports: module.exports,
    require: relative => miniModule(path.resolve(path.dirname(absolute), relative.endsWith('.js') ? relative : relative + '.js'), cache),
  }, { filename: absolute });
  return module.exports;
}
const miniNormalizeRecord = miniModule(path.join(miniRoot, 'shared/records.js')).normalizeRecord;

function webDetail(item) {
  const component = fs.readFileSync(new URL('../src/components/EventDetail.vue', import.meta.url), 'utf8');
  const script = component.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*\r?\n/gm, '');
  const context = { defineProps: () => ({ item }), defineEmits: () => () => {},
    computed: fn => ({ get value() { return fn(); } }),
    useLanguageStore: () => ({ t: {} }), useEventsStore: () => ({ records: [], artistCatalog: [] }),
    richTextHtml, richTextForText,
  };
  vm.runInNewContext(script + '\nglobalThis.result = { descriptionHtml: descriptionHtml.value, noteHtml: noteHtml.value };', context);
  return context.result;
}

async function miniDetail(event) {
  let page;
  const file = path.join(miniRoot, 'pages/detail/index.js');
  const helpers = miniModule(path.join(miniRoot, 'shared/richText.js'));
  const dependencies = {
    '../../lib/feed': { load: async () => ({ records: [event] }) },
    '../../lib/api': { token: async () => null },
    '../../lib/i18n': { current: () => ({}) },
    '../../lib/tickets': { ticketChannel: () => '' },
    '../../shared/richText': helpers,
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { Page: value => { page = value; },
    require: key => { if (!dependencies[key]) throw Error('Unexpected dependency: ' + key); return dependencies[key]; },
    wx: { setNavigationBarTitle() {} },
  }, { filename: file });
  page.id = event.id;
  page.setData = value => Object.assign(page.data, value);
  await page.load();
  assert.equal(page.data.error, '');
  return page.data;
}

test('web and mini normalization retain allowlisted documents and independent plain fields', () => {
  const raw = { ...base, participation_rules: 'Please <join>', note: 'Bring ID', steps: 'Task instructions',
    rich_text: { description: doc('Please <join>', { bold: true, color: '#AaBbCc', onclick: 'bad()' }),
      note: doc('Bring ID', { underline: true }), extra: '<script>bad()</script>' } };
  const web = normalizeRecord(raw), mini = miniNormalizeRecord(raw);
  assert.equal(web.participation_rules, raw.participation_rules);
  assert.equal(web.note, raw.note);
  assert.equal(web.steps, raw.steps);
  assert.deepEqual(Object.keys(web.rich_text).sort(), ['description', 'note']);
  assert.deepEqual(copy(mini.rich_text), web.rich_text);
  assert.deepEqual(web.rich_text.description.blocks[0].runs[0], { text: 'Please <join>', bold: true, color: '#aabbcc' });
});

test('actual web and mini detail rendering preserve formatting while escaping text', async () => {
  const raw = { ...base, participation_rules: 'Please <join>', note: 'Bring ID',
    rich_text: { description: doc('Please <join>', { bold: true, color: '#aabbcc' }), note: doc('Bring ID', { italic: true, underline: true }) } };
  const web = webDetail(normalizeRecord(raw)), mini = await miniDetail(miniNormalizeRecord(raw));
  assert.equal(mini.descriptionHtml, web.descriptionHtml);
  assert.equal(mini.noteHtml, web.noteHtml);
  assert.match(web.descriptionHtml, /<strong>Please &lt;join&gt;<\/strong>/);
  assert.match(web.descriptionHtml, /color:#aabbcc/);
  assert.match(web.noteHtml, /<u><em>Bring ID<\/em><\/u>/);
  assert.doesNotMatch(web.descriptionHtml, /<join>/);
});

test('legacy plain text and an older formatted revision render current plain text in both clients', async () => {
  for (const rich_text of [undefined, { description: doc('Old rules', { bold: true }), note: doc('Old note', { italic: true }) },
    { description: '<script>bad()</script>', note: { version: 1, blocks: [{ type: 'script', runs: [] }] } }]) {
    const raw = { ...base, participation_rules: 'New rules\n<script>safe text</script>', note: 'New & current', rich_text };
    const record = normalizeRecord(raw), web = webDetail(record), mini = await miniDetail(miniNormalizeRecord(raw));
    assert.equal(mini.descriptionHtml, web.descriptionHtml);
    assert.equal(mini.noteHtml, web.noteHtml);
    assert.match(web.descriptionHtml, /New rules<br>&lt;script&gt;safe text&lt;\/script&gt;/);
    assert.match(web.noteHtml, /New &amp; current/);
    assert.doesNotMatch(web.descriptionHtml + web.noteHtml, /Old rules|Old note|<script>|<strong>|<em>/);
  }
  const raw = { ...base, note: '' };
  assert.match(webDetail(normalizeRecord(raw)).noteHtml, /暂无备注/);
  assert.match((await miniDetail(miniNormalizeRecord(raw))).noteHtml, /暂无备注/);
});
