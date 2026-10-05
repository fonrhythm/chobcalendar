import test from 'node:test';
import assert from 'node:assert/strict';
import {eventDisplayName} from '../src/utils/cpDisplayName.js';
import {occursOn} from '../src/utils/dates.js';
test('activity title is opt-in and retains parent title for ticketing',()=>{assert.equal(eventDisplayName({name:'Artist',activity:'Party'},[]),'Artist');assert.equal(eventDisplayName({name:'Artist',activity:'Party',prefer_activity_name:true},[]),'Party');assert.equal(eventDisplayName({kind:'task',name:'Artist',activity:'Ticket sale',event_title:'Party',prefer_activity_name:true},[]),'Party');});
test('one multi-day record covers both dates and stops at its end',()=>{const r={kind:'event',date:'2026-10-30',end_date:'2026-10-31'};assert(occursOn(r,'2026-10-30'));assert(occursOn(r,'2026-10-31'));assert(!occursOn(r,'2026-11-01'));});
