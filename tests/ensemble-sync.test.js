import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { eventArtistTypeKeys, artistTypeKeys, artistTypeKey } from '../src/utils/artistFilters.js';
import { REGION_COLORS, normalizeCategory } from '../src/utils/config.js';
import { normalizeRecord } from '../src/utils/records.js';
import { artistTypes, selectionTypes } from '../src/utils/artistSelection.js';

test('idol groups and music groups remain separate across web and mini-program', () => {
  const context = { module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(new URL('../miniprogram/client/shared/artistFilters.js', import.meta.url), 'utf8'), context);
  const catalog = [
    { id: 'idol', categories: ['IDOL'], group_kind: 'group', group_member_ids: ['member'] },
    { id: 'duo', categories: ['GROUP'], group_kind: 'group', group_member_ids: ['member'] },
    { id: 'member', categories: ['ACTOR', 'GROUP'] },
  ];
  for (const id of ['idol', 'duo']) {
    const event = { artist_ids: ['member'], artist_selections: [id], artist_types: ['组合'] };
    assert.deepEqual([...context.module.exports.eventArtistTypeKeys(event, catalog)], eventArtistTypeKeys(event, catalog));
  }
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['member'], artist_selections: ['idol'], artist_types: ['组合'] }, catalog), ['idol', 'actor']);
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['idol', 'member'] }, catalog), ['idol', 'actor']);
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['member'], artist_selections: ['duo'] }, catalog), ['group', 'actor']);
  assert.deepEqual(artistTypeKeys({ group_kind: 'group', categories: [] }), []);
  assert.deepEqual(artistTypes(['IDOL', '男女团', 'GROUP', '组合', 'ensemble']), ['男女团', '组合']);
  assert.deepEqual(selectionTypes(catalog, ['idol']), ['男女团', '演员']);
  assert.deepEqual(selectionTypes(catalog, ['duo']), ['组合', '演员']);
});

test('catalog classifications override legacy group payloads without affecting fallback', () => {
  const catalog = [{ id: 'solo', categories: ['SINGER'] }, { id: 'cp:a', categories: ['CP'] }];
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['solo'], artist_types: ['组合'], category: 'group' }, catalog), ['singer']);
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['cp:a'], artist_types: ['组合'], category: 'group' }, catalog), ['other']);
  assert.deepEqual(eventArtistTypeKeys({ artist_types: ['组合'] }), ['group']);
  assert.deepEqual(eventArtistTypeKeys({ artist_types: ['IDOL'] }), ['idol']);
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['unknown'], attributes: { artist_type: '乐队' } }, [{ id: 'unknown', categories: [] }]), ['band']);
  assert.deepEqual(eventArtistTypeKeys({ artist_ids: ['unknown'], artist_types: ['组合', 'IDOL', '演员'] }, [{ id: 'unknown', categories: [] }]), ['actor']);
  assert.equal(artistTypeKey('男女团'), 'idol');
  assert.equal(artistTypeKey('GROUP'), 'group');
  assert.equal(artistTypeKey('ensemble'), 'group');
});

test('all regions retain distinct idol and music-group styles and normalize records', () => {
  for (const region of ['thailand', 'china', 'oversea']) {
    assert.ok(REGION_COLORS[region]['c-idol']);
    assert.ok(REGION_COLORS[region]['c-group']);
    assert.notEqual(REGION_COLORS[region]['c-idol'], REGION_COLORS[region]['c-group']);
    assert.equal(REGION_COLORS[region]['c-ensemble'], undefined);
    for (const [value, expected] of [['IDOL', 'idol'], ['男女团', 'idol'], ['GROUP', 'group'], ['组合', 'group'], ['ensemble', 'group']]) {
      assert.equal(normalizeCategory(value, region), expected);
      const row = { id: 'x', name: 'Artist', date: '2026-10-20', region, category: value };
      assert.equal(normalizeRecord(row).category, expected);
    }
  }
});

test('mini-program ignores old classification caches and localizes the new genres', () => {
  let app;
  const oldFeed = { artists: [{ id: 'idol', categories: ['GROUP'] }] };
  vm.runInNewContext(fs.readFileSync(new URL('../miniprogram/client/app.js', import.meta.url), 'utf8'), {
    App: value => { app = value; },
    wx: { getStorageSync: key => key === 'chob-feed' || key === 'chob-feed-v2' ? oldFeed : null },
  });
  app.onLaunch();
  assert.equal(app.globalData.feed, null);
  for (const [language, idol, group] of [['zh', '男女团', '组合'], ['en', 'Idol Group', 'Music Group'], ['th', 'วงไอดอล', 'กลุ่มดนตรี']]) {
    const context = { module: { exports: {} }, wx: { getStorageSync: () => language } };
    vm.runInNewContext(fs.readFileSync(new URL('../miniprogram/client/lib/i18n.js', import.meta.url), 'utf8'), context);
    assert.equal(context.module.exports.current().artistTypeLabels.idol, idol);
    assert.equal(context.module.exports.current().artistTypeLabels.group, group);
  }
});
