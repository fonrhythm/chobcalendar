import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCategoryColor, resolveEventCategory, getEventDisplayStyle } from '../src/utils/config.js';
import { prefersActivityTitle } from '../src/utils/cpDisplayName.js';

test('all regions share the requested eight colours, with distinct idol and ensemble aliases', () => {
  const expected = { bl:'#C96D8A',gl:'#6F8FBD',band:'#9A4650',singer:'#B97A3E',idol:'#7A5446',group:'#4F6491',actor:'#DDBE82',other:'#B3A59B' };
  for (const region of ['thailand','china','oversea']) for (const [category,bg] of Object.entries(expected)) {
    assert.deepEqual(getCategoryColor(category,region),{bg,text:['actor','other'].includes(category)?'#4A3426':'#FFFFFF'});
  }
  assert.deepEqual(getCategoryColor('IDOL'),getCategoryColor('男女团'));
  assert.deepEqual(getCategoryColor('GROUP'),getCategoryColor('组合'));
  assert.notDeepEqual(getCategoryColor('IDOL'),getCategoryColor('GROUP'));
  assert.deepEqual(getCategoryColor('ensemble'),getCategoryColor('group'));
  assert.deepEqual(getCategoryColor('music'),getCategoryColor('singer'));
});

test('artist library genres win over stale event classifications and member professions', () => {
  const catalog = [{id:'idol',categories:['IDOL'],member_ids:['member']},{id:'duo',categories:['GROUP'],member_ids:['member']},{id:'member',categories:['ACTOR','SINGER']}];
  assert.equal(resolveEventCategory({artist_selections:['idol'],artist_ids:['member'],category:'group'},catalog),'idol');
  assert.equal(resolveEventCategory({artist_selections:['duo'],artist_ids:['member'],category:'idol'},catalog),'group');
  assert.equal(resolveEventCategory({artist_ids:['a'],category:'actor'},[{id:'a',categories:['SINGER','GL']}]),'gl');
  const event={artist_ids:['a','b']},mixed=[{id:'a',categories:['ACTOR']},{id:'b',categories:['BAND']}];
  assert.equal(resolveEventCategory(event,mixed),resolveEventCategory(event,[...mixed].reverse()));
});

test('outline and roll-call are independent of source and headcount', () => {
  const basic={region:'thailand',category:'singer',artist_count:1};
  assert.equal(getEventDisplayStyle({...basic,isofficial:true}).outline,false);
  assert.equal(getEventDisplayStyle({...basic,artist_count:7}).outline,true);
  assert.equal(getEventDisplayStyle({...basic,artist_count:7}).rollCall,false);
  assert.equal(getEventDisplayStyle({...basic,roll_call:true}).rollCall,true);
  assert.equal(getEventDisplayStyle({...basic,roll_call:true}).outline,false);
  assert.equal(getEventDisplayStyle({...basic,prefer_activity_name:true}).outline,true);
  const event={...basic,artist_count:3,artist_ids:['a','b','c'],activity:'Festival'};
  const catalog=[{id:'a',company:'One',categories:['BL']},{id:'b',company:'One',categories:['BL']},{id:'c',company:'Two',categories:['SINGER']}];
  assert.equal(getEventDisplayStyle({...event,prefer_activity_name:prefersActivityTitle(event,catalog)},catalog).outline,true);
});

function miniModule(file, cache = new Map()) {
  const absolute=path.resolve(file);if(cache.has(absolute))return cache.get(absolute).exports;
  const module={exports:{}};cache.set(absolute,module);
  vm.runInNewContext(fs.readFileSync(absolute,'utf8'),{module,exports:module.exports,require:relative=>miniModule(path.resolve(path.dirname(absolute),relative),cache)});
  return module.exports;
}
test('mini-program resolves the same palette, catalogue priority and independent star state', () => {
  const mini=miniModule(fileURLToPath(new URL('../miniprogram/client/shared/config.js',import.meta.url)));
  const catalog=[{id:'a',categories:['GL','SINGER']},{id:'g',categories:['GROUP'],member_ids:['a']}];
  for(const event of [{artist_ids:['a'],category:'other'},{artist_selections:['g'],artist_ids:['a']},{category:'IDOL',artist_count:7},{category:'actor',roll_call:true}]) {
    assert.deepEqual(JSON.parse(JSON.stringify(mini.getEventDisplayStyle(event,catalog))),getEventDisplayStyle(event,catalog));
  }
});
