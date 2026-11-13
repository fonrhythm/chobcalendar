import test from 'node:test';import assert from 'node:assert/strict';import {broadcastStatus,onAirStatistics,sortLibrary,visibleProduction,sortCalendarSlots,effectiveWeekdays} from '../src/drama/library.js';
const d=(id,types=['Boys Love'])=>({id,titleZh:id,types,production:'已杀青',rules:[{id:'r',platformId:'p',premiere:'2026-11-05',totalEpisodes:3,weekdays:[4],episodesPerRelease:1,time:'20:00',timezone:'Asia/Bangkok'}]});
test('airing statistics count series once, include BG as a category and ignore undated titles',()=>{const a=d('a'),b=d('b',['BG']);assert.equal(broadcastStatus(a,[],'2026-11-04'),'待播');assert.equal(broadcastStatus(a,[],'2026-11-05'),'播出中');assert.equal(broadcastStatus(a,[],'2026-11-20'),'已完播');const stats=onAirStatistics([a,a,b,{...d('c'),rules:[]}],[],'2026-11-10');assert.deepEqual(stats.map(s=>s.count),[1,0,1,0,0,0]);});
test('sorting does not mutate the query result',()=>{const rows=[d('乙'),d('甲')];const original=[...rows];sortLibrary(rows,'title');assert.deepEqual(rows,original);assert.equal(onAirStatistics([],[],'2026-11-10').every(s=>s.count===0),true);});

test('production is optional and hidden once broadcasting has started',()=>{const row=d('state');assert.equal(visibleProduction(row,[],'2026-11-04'),'已杀青');assert.equal(visibleProduction({...row,production:''},[],'2026-11-04'),'');assert.equal(visibleProduction(row,[],'2026-11-10'),'');assert.equal(visibleProduction(row,[],'2026-12-01'),'');});

test('calendar sorts by English title per day, then episode, with untranslated titles last',()=>{
 const dramas=[{id:'z',titleEn:'Zulu'},{id:'a',titleEn:' alpha '},{id:'b',titleEn:'Beta'},{id:'missing',titleZh:'中文剧名'}];
 const slot=(id,dramaId,episode=1,date='2026-11-10')=>({id,dramaId,episode,date});
 const rows=[slot('z','z'),slot('m','missing'),slot('a2','a',2),slot('b','b'),slot('a1','a'),slot('earlier','z',1,'2026-11-09')];
 assert.deepEqual(sortCalendarSlots(rows,dramas).map(s=>s.id),['earlier','a1','a2','b','z','m']);
 assert.equal(rows[0].id,'z');
});

test('weekday labels use the phase effective on the selected episode date, including its first day',()=>{
 const rule={weekdays:[4,5],phases:[{from:'2026-12-01',weekdays:[2]},{from:'2026-10-22',weekdays:[4,0]}]};
 assert.deepEqual(effectiveWeekdays(rule,'2026-10-21'),[4,5]);
 assert.deepEqual(effectiveWeekdays(rule,'2026-10-22'),[4,0]);
 assert.deepEqual(effectiveWeekdays(rule,'2026-11-08'),[4,0]);
 assert.deepEqual(effectiveWeekdays(rule,'2026-12-01'),[2]);
 assert.deepEqual(rule.weekdays,[4,5]);
});
