import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateSchedule, reschedule, announcementsForEpisode, validateDrama} from '../src/drama/schedule.js';
const drama = {id:'d',titleTh:'ทดสอบ',types:['Bromance','群像']};
const rule = {id:'r',premiere:'2026-12-25',totalEpisodes:4,episodesPerRelease:2,platformId:'youtube',time:'23:30',timezone:'Asia/Bangkok'};
test('undated dramas stay out of calendar and require one title',()=>{assert.deepEqual(generateSchedule(drama,{}),[]);assert.throws(()=>validateDrama({}));});
test('schedule crosses years and generates stable identities',()=>{const rows=generateSchedule(drama,rule);assert.equal(rows[2].date,'2027-01-01');assert.equal(rows[1].date,'2026-12-25');assert.deepEqual(rows,generateSchedule(drama,rule));assert.equal(rows[2].confidence,'calculated');});
test('changes retain original slot and announcements reach adjacent episodes only',()=>{const rows=generateSchedule(drama,rule);const change=reschedule(rows[1],{date:'2027-01-02',time:'20:30'},{id:'a',content:'延期'});assert.equal(change.original.date,rows[1].date);assert.equal(change.original.status,'changed');assert.equal(rows[1].status,'scheduled');for(const ep of [1,2,3]) assert.equal(announcementsForEpisode([change.announcement],'d',ep).length,1);assert.equal(announcementsForEpisode([change.announcement],'d',4).length,0);});
test('invalid dates and incomplete platform rules fail',()=>{assert.throws(()=>generateSchedule(drama,{...rule,premiere:'2026-02-30'}));assert.throws(()=>generateSchedule(drama,{...rule,timezone:'bad'}));});
