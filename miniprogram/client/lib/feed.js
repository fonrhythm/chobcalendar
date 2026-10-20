const api=require('./api'),{normalizeRecord}=require('../shared/records'),{eventDisplayName}=require('../shared/cpDisplayName'),{dateKey,addDays,parseDate}=require('../shared/dates');
const pending=new Map();let rangeRevision=0;
function windowFor(month){const first=month+'-01',next=parseDate(first);next.setMonth(next.getMonth()+1);return {start:addDays(first,-7),end:addDays(dateKey(next),6)}}
async function load(force=false,options){
 const app=getApp(),args=options||app.globalData.feedWindow||windowFor(dateKey(new Date()).slice(0,7)),range=!args.ids&&!args.artist_query&&!args.artist_ids;
 const key=JSON.stringify(args);if(!force&&range&&app.globalData.feed?.queryKey===key)return app.globalData.feed;
 if(pending.has(key))return pending.get(key);
 const revision=range?++rangeRevision:rangeRevision;
 const promise=(async()=>{
  let page=0,raw=[],artists=new Map(),notices=new Map(),meta;
  for(let n=0;n<20;n++){
   const f=await api.rpc('chob_public_feed',range?{...args,page}:args);meta=f;raw.push(...f.records);for(const a of f.artists||[])artists.set(a.id,a);for(const a of f.announcements||[])notices.set(a.id,a);
   if(!range||f.next_page==null)break;
   if(!Number.isSafeInteger(f.next_page)||f.next_page<=page||n===19)throw Error('日历分页响应无效');page=f.next_page;
  }
  const current=app.globalData.feed||{records:[],artists:[]};for(const a of current.artists||[])if(!artists.has(a.id))artists.set(a.id,a);
  const catalog=[...artists.values()],incoming=raw.map((r,i)=>{const e=normalizeRecord(r,i,'supabase');return {...e,name:eventDisplayName(e,catalog)}}),ids=new Set(incoming.map(r=>r.id));
  const retained=current.records.filter(r=>!ids.has(r.id)&&(!range||r.date&&(r.date>args.end||(r.end_date||r.date)<args.start)));
  const feed={...current,...meta,records:[...retained,...incoming],artists:catalog,announcements:[...notices.values()],queryKey:range?key:current.queryKey};
  if(!range||revision===rangeRevision){app.globalData.feed=feed;if(range)app.globalData.feedWindow=args;wx.setStorageSync('chob-feed-v3',feed)}
  return feed;
 })().finally(()=>pending.delete(key));pending.set(key,promise);return promise;
}
module.exports={load,windowFor};
