import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFeed} from '../src/feedQuery.js';
test('month feed retains all seven public session relationships without exposing detail metadata',()=>{
 const records=Array.from({length:7},(_,i)=>({id:`event-${i}`,kind:'event',date:`2026-12-${String(9+i).padStart(2,'0')}`,parent_event:i?{id:'event-0',title:'Musical'}:null,sources:[{url:'detail only'}]}));
 const result=projectFeed({records,artists:[]},{mode:'range',start:'2026-12-01',end:'2026-12-31',page:0});
 assert.equal(result.records.length,7);
 assert.equal(result.records.filter(r=>r.id==='event-0'||r.parent_event?.id==='event-0').length,7);
 assert.ok(result.records.every(r=>!('sources' in r)));
});
