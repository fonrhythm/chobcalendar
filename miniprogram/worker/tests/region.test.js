import test from 'node:test';import assert from 'node:assert/strict';import {projectFeed} from '../src/feedQuery.js';
test('legacy mini-program receives supported region values for published overseas places',()=>{
const regions=['越南','菲律宾','巴西','中国香港','中国澳门','中国台湾','韩国'];
const records=regions.map((region,i)=>({id:String(i),date:'2026-11-26',kind:'event',region}));
for(const q of [{mode:'range',start:'2026-11-01',end:'2026-11-30',page:0},{mode:'ids',ids:records.map(r=>r.id)}]) assert.ok(projectFeed({records,artists:[]},q).records.every(r=>r.region==='oversea'));
assert.equal(records[0].region,'越南');
});
