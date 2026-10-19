import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {eventArtistTypeKeys,artistTypeKeys} from '../src/utils/artistFilters.js';
import {REGION_COLORS,normalizeCategory} from '../src/utils/config.js';
import {normalizeRecord} from '../src/utils/records.js';
import {selectionTypes} from '../src/utils/artistSelection.js';
test('web and mini-program classify group selections identically',()=>{
 const context={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(new URL('../miniprogram/client/shared/artistFilters.js',import.meta.url),'utf8'),context);
 const catalog=[{id:'g',categories:['GROUP'],group_kind:'group',group_member_ids:['p']},{id:'p',categories:['ACTOR']}];const event={artist_ids:['p'],artist_selections:['g']};
 assert.deepEqual([...context.module.exports.eventArtistTypeKeys(event,catalog)],eventArtistTypeKeys(event,catalog));
 assert.deepEqual(artistTypeKeys({group_kind:'group',categories:[]}),['ensemble']);assert.ok(selectionTypes([{id:'g',categories:['ensemble']}],['g']).includes('组合'));
});
test('all regions provide ensemble styling and record normalization',()=>{
 for(const region of ['thailand','china','oversea']){assert.ok(REGION_COLORS[region]['c-ensemble']);assert.equal(normalizeCategory('组合',region),'ensemble');assert.equal(normalizeCategory('ensemble',region),'ensemble');}
 const row={id:'x',name:'A group',date:'2026-10-20',region:'thailand',category:'组合'};assert.equal(normalizeRecord(row).category,'ensemble');
});
