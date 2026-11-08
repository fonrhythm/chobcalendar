import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateSchedule, reschedule, announcementsForEpisode, validateDrama} from '../src/drama/schedule.js';
const drama = {id:'d',titleTh:'ทดสอบ',types:['Bromance','群像']};
const rule = {id:'r',premiere:'2026-12-25',totalEpisodes:4,episodesPerRelease:2,platformId:'youtube',time:'23:30',timezone:'Asia/Bangkok'};
test('undated dramas stay out of calendar and require one title',()=>{assert.deepEqual(generateSchedule(drama,{}),[]);assert.throws(()=>validateDrama({}));});
test('schedule crosses years and generates stable identities',()=>{const rows=generateSchedule(drama,rule);assert.equal(rows[2].date,'2027-01-01');assert.equal(rows[1].date,'2026-12-25');assert.deepEqual(rows,generateSchedule(drama,rule));assert.equal(rows[2].confidence,'calculated');});
test('changes retain original slot and announcements reach adjacent episodes only',()=>{const rows=generateSchedule(drama,rule);const change=reschedule(rows[1],{date:'2027-01-02',time:'20:30'},{id:'a',content:'延期'});assert.equal(change.original.date,rows[1].date);assert.equal(change.original.status,'changed');assert.equal(rows[1].status,'scheduled');for(const ep of [1,2,3]) assert.equal(announcementsForEpisode([change.announcement],'d',ep).length,1);assert.equal(announcementsForEpisode([change.announcement],'d',4).length,0);});
test('invalid dates and incomplete platform rules fail',()=>{assert.throws(()=>generateSchedule(drama,{...rule,premiere:'2026-02-30'}));assert.throws(()=>generateSchedule(drama,{...rule,timezone:'bad'}));});

test('weekly days and dated changes support Thu/Fri then Thu/Sun',()=>{const rows=generateSchedule(drama,{...rule,premiere:'2026-11-05',weekdays:[4,5],totalEpisodes:6,episodesPerRelease:1,phases:[{from:'2026-11-12',weekdays:[4,0]}]});assert.deepEqual(rows.map(r=>r.date),['2026-11-05','2026-11-06','2026-11-12','2026-11-15','2026-11-19','2026-11-22']);});
test('weekly validation rejects empty days, mismatched premiere and invalid phases',()=>{assert.throws(()=>generateSchedule(drama,{...rule,weekdays:[]}));assert.throws(()=>generateSchedule(drama,{...rule,weekdays:[4]}));assert.throws(()=>generateSchedule(drama,{...rule,weekdays:[5],phases:[{from:'2026-12-26',weekdays:[]}]}));});

test('weekday changes can take effect on the premiere day',()=>{const rows=generateSchedule(drama,{...rule,premiere:'2026-11-05',totalEpisodes:3,episodesPerRelease:1,weekdays:[5],phases:[{from:'2026-11-05',weekdays:[4,0]}]});assert.deepEqual(rows.map(r=>r.date),['2026-11-05','2026-11-08','2026-11-12']);});
