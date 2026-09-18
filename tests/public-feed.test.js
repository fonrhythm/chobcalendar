import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { readPublicFeed } from '../src/api/publicFeed.js'
import { occursOn } from '../src/utils/dates.js'
function run(rows, region='thailand', official=false, fail=false) {
 const context = { Date, SpreadsheetApp:{openById:()=> {
  if(fail) throw Error('private error');
  return {getSpreadsheetTimeZone:()=> 'Asia/Bangkok',getSheets:()=> [{
   getSheetId:()=>1, getDataRange:()=>({getValues:()=>rows})
  }]}
 }},Utilities:{formatDate:(date,zone,pattern)=>pattern==='HH:mm'?'09:30':'2026-09-18'},
 ContentService:{MimeType:{JSON:'json'}, createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}}
 vm.createContext(context)
 vm.runInContext(fs.readFileSync(new URL('../apps-script/PublicFeed.gs',import.meta.url),'utf8')+
  '\nCHOB_PUBLIC_SOURCES.splice(0,CHOB_PUBLIC_SOURCES.length,{id:"test",region:'+JSON.stringify(region)+',official:'+official+'});',context)
 return context.chobPublicFeed()
}
test('legacy rows become public event and sale task; source controls official status',async()=>{
 const body=run([['name','date','sale_date','sale_time','picture_urls','userid','isofficial','sale_end_date'],
 ['Artist','2026-09-20','2026-09-18','10:00','https://example.com/a.png','private','true','2026-09-19']])
 assert.equal(body.success,true)
 assert.equal(body.data.length,2)
 assert.equal(body.data[0].isofficial,false)
 assert.equal(body.data[0].userid,undefined)
 let request
 const records=await readPublicFeed('https://example.com/exec',undefined,async url=>{
  request=new URL(url);return {ok:true,json:async()=>body}
 })
 assert.equal(request.searchParams.get('action'),'publicFeed')
 assert.equal(request.searchParams.has('key'),false)
 assert.equal(records[0].images[0],'https://example.com/a.png')
 assert.equal(records[1].kind,'task')
 assert.equal(occursOn(records[1],'2026-09-18'),true)
 assert.equal(occursOn(records[1],'2026-09-19'),true)
 assert.equal(occursOn(records[1],'2026-09-20'),false)
})
test('combined sources infer explicit region; malformed data produces actionable error',()=>{
 assert.equal(run([['name','date','source'],['A','2026-09-18','来华行程']],'',true).data[0].region,'china')
 assert.equal(run([['name','date'],['A','2026-02-30']]).success,false)
 assert.equal(run([['name','date'],['A','2026-09-18']],'').success,false)
 assert.equal(run([['name','date'],['A','2026-09-18']],'thailand',false,true).success,false)
 assert.equal(run([['id','name','date'],['x','A','2026-09-18'],['x','B','2026-09-18']]).success,false)
})
test('native Sheets date/time values are formatted and official flag is retained',()=>{
 const body=run([['name','date','time'],['A',new Date('2026-09-18T00:00:00Z'),new Date()]],'thailand',true)
 assert.equal(body.data[0].date,'2026-09-18')
 assert.equal(body.data[0].time,'09:30')
 assert.equal(body.data[0].isofficial,true)
})
test('old deployment and login HTML are diagnosed instead of treated as empty calendar',async()=>{
 await assert.rejects(()=>readPublicFeed('https://example.com/exec',null,async()=>({ok:true,json:async()=>({success:false,error:'KEY_MISMATCH'})})),/PublicFeed/)
 await assert.rejects(()=>readPublicFeed('https://example.com/exec',null,async()=>({ok:true,json:async()=>{throw Error()}})),/JSON/)
})

