const DAY=86400000;
export function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:null}
export function parseQuery(args,now=new Date()){
 if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Invalid parameters');
 const keys=Object.keys(args);
 if('artist_ids' in args){if(keys.length!==1||!Array.isArray(args.artist_ids)||!args.artist_ids.length||args.artist_ids.length>20||args.artist_ids.some(id=>typeof id!=='string'||!/^(cp:)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))throw Error('Invalid artist identifiers');return {mode:'artist_ids',ids:args.artist_ids};}
 if('artist_query' in args){if(keys.length!==1||typeof args.artist_query!=='string')throw Error('Invalid artist search');const q=args.artist_query.normalize('NFKC').trim().toLowerCase();if([...q].length<2||q.length>60)throw Error('请输入至少两个字符搜索艺人。');return {mode:'artists',q};}
 if('ids' in args){if(keys.length!==1||!Array.isArray(args.ids)||!args.ids.length||args.ids.length>20||args.ids.some(id=>typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))throw Error('Invalid event identifiers');return {mode:'ids',ids:[...new Set(args.ids)]};}
 if(keys.some(k=>!['start','end','page'].includes(k)))throw Error('Invalid parameters');
 const m=new Date(now.getTime()+8*3600000).toISOString().slice(0,7);
 const start=args.start??m+'-01',end=args.end??new Date(Date.parse(m+'-01T00:00:00Z')+31*DAY).toISOString().slice(0,10);
 const a=date(start),b=date(end),page=args.page??0;
 if(a===null||b===null||b<a||b-a>61*DAY||!Number.isSafeInteger(page)||page<0||page>19)throw Error('单次查询最多 62 天，请缩小日期范围。');
 return {mode:'range',start,end,page};
}
const summaryKeys='id rich_text city date kind link name note time type venue images region company activity category end_date roll_call user_task artist_ids isofficial updated_at event_title artist_count artist_names artist_types event_status activity_type original_date pending_fields recurring_daily related_event_id artist_selections postponed_to_date participation_label participation_rules prefer_activity_name participation_condition steps end_time event_id is_closed task_type action_url result_url'.split(' ');
const artistKeys='id name en_name company categories group_kind group_member_ids member_ids aliases'.split(' ');
const pick=(row,keys)=>Object.fromEntries(keys.filter(k=>k in row).map(k=>[k,row[k]]));
function linkedArtists(feed,rows){const ids=new Set(rows.flatMap(r=>[...(r.artist_ids||[]),...(r.artist_selections||[])]));const selected=feed.artists.filter(a=>ids.has(a.id)||((a.member_ids||a.group_member_ids||[]).length&&(a.member_ids||a.group_member_ids).every(id=>ids.has(id))));const memberIds=new Set(selected.flatMap(a=>a.member_ids||a.group_member_ids||[]));return feed.artists.filter(a=>selected.includes(a)||memberIds.has(a.id)).map(a=>pick(a,artistKeys));}
export function projectFeed(feed,q){
 const metadata={types:feed.types||[],conditions:feed.conditions||[]};
 if(q.mode==='artists'||q.mode==='artist_ids'){
  const matches=q.mode==='artist_ids'?feed.artists.filter(a=>q.ids.includes(a.id)):feed.artists.filter(a=>[a.name,a.en_name,...(Array.isArray(a.aliases)?a.aliases:[])].some(v=>String(v||'').normalize('NFKC').toLowerCase().includes(q.q))).slice(0,40);
  const members=new Set(matches.flatMap(a=>a.member_ids||a.group_member_ids||[]));
  return {...metadata,records:[],announcements:[],artists:feed.artists.filter(a=>matches.includes(a)||members.has(a.id)).map(a=>pick(a,artistKeys)),search:q.q};
 }
 let rows,hasMore=false;
 if(q.mode==='ids'){
  const ids=new Set(q.ids);rows=feed.records.filter(r=>ids.has(r.id)||r.kind==='task'&&ids.has(r.event_id));
  if(rows.length>150)throw Error('活动事项过多，请一次查询更少的活动。');
 }else{
  rows=feed.records.filter(r=>{
   if(!r.date)return true;
   const end=r.end_date||(r.kind==='task'&&r.task_type==='ticketing'&&!r.is_closed?'9999-12-31':r.date);
   return r.date<=q.end&&end>=q.start;
  }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||a.id.localeCompare(b.id));
  hasMore=rows.length>(q.page+1)*150;rows=rows.slice(q.page*150,(q.page+1)*150);
 }
 const keys=q.mode==='ids'?[...summaryKeys,'sources','changes','field_states','venue_entity','parent_event','companies','last_verified_at']:summaryKeys;
 const recordIds=new Set(rows.flatMap(r=>[r.id,r.event_id]));
 return {...metadata,records:rows.map(r=>pick(r,keys)),artists:linkedArtists(feed,rows),announcements:(feed.announcements||[]).filter(a=>!a.event_id||recordIds.has(a.event_id)).slice(0,20),...(q.mode==='range'?{window:{start:q.start,end:q.end},next_page:hasMore?q.page+1:null}:{})};
}
