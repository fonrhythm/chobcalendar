import {generateSchedule} from './schedule.js';
export function broadcastRows(drama,changes=[]){return (drama.rules||[]).flatMap(rule=>{let rows=generateSchedule(drama,rule);for(const c of changes.filter(c=>c.original.dramaId===drama.id&&c.original.ruleId===rule.id)){rows=rows.map(s=>s.id===c.original.id?c.original:s);rows.push(c.replacement);}return rows;}).filter(s=>s.status!=='changed');}
export function broadcastStatus(drama,changes=[],today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'})){const rows=broadcastRows(drama,changes);if(!rows.length)return drama.production||'未定档';const dates=rows.map(s=>s.date).sort();if(drama.rules.some(r=>r.totalEpisodesUnknown&&r.premiere&&r.premiere<=today))return '播出中';return today<dates[0]?'待播':today>dates.at(-1)?'已完播':'播出中';}
export function onAirStatistics(dramas,changes=[],today){const active=[...new Map(dramas.map(d=>[d.id,d])).values()].filter(d=>broadcastStatus(d,changes,today)==='播出中');return ['Boys Love','Girls Love','BG','Bromance','群像','其他'].map(type=>({type,label:({'Boys Love':'BL 剧集','Girls Love':'GL 剧集',total:'在播总计',其他:'其他类型',群像:'群像剧集'})[type]||type,count:type==='total'?active.length:active.filter(d=>d.types.includes(type)).length}));}
export function sortLibrary(dramas,mode,changes=[]){const first=d=>broadcastRows(d,changes).map(s=>s.date).sort()[0]||'9999';return [...dramas].sort((a,b)=>mode==='episodes'?Math.max(0,...b.rules.map(r=>r.totalEpisodes))-Math.max(0,...a.rules.map(r=>r.totalEpisodes)):mode==='english'?(a.titleEn||a.titleZh||a.titleTh||'').localeCompare(b.titleEn||b.titleZh||b.titleTh||'','en'):mode==='title'?(a.titleZh||a.titleTh||a.titleEn||'').localeCompare(b.titleZh||b.titleTh||b.titleEn||'','zh-Hans-CN'):first(a).localeCompare(first(b)));}

export function visibleProduction(drama,changes=[],today){const state=broadcastStatus(drama,changes,today);return ['播出中','已完播'].includes(state)?'':(drama.production||'');}

const calendarEnglishOrder=new Intl.Collator('en',{sensitivity:'base',numeric:true});
const calendarFallbackOrder=new Intl.Collator('zh-Hans-CN',{sensitivity:'base',numeric:true});
export function sortCalendarSlots(slots,dramas){
 const byId=new Map(dramas.map(drama=>[drama.id,drama]));
 const english=drama=>String(drama?.titleEn||'').normalize('NFKC').trim();
 return [...slots].sort((a,b)=>{
  const date=a.date.localeCompare(b.date);if(date)return date;
  const first=byId.get(a.dramaId),second=byId.get(b.dramaId),aName=english(first),bName=english(second);
  if(Boolean(aName)!==Boolean(bName))return aName?-1:1;
  const title=aName?calendarEnglishOrder.compare(aName,bName):calendarFallbackOrder.compare(first?.titleZh||first?.titleTh||'',second?.titleZh||second?.titleTh||'');
  return title||Number(a.episode)-Number(b.episode)||String(a.id).localeCompare(String(b.id));
 });
}

export function effectiveWeekdays(rule,date){
 let days=rule.weekdays||[];
 for(const phase of [...(rule.phases||[])].sort((a,b)=>a.from.localeCompare(b.from)))if(phase.from<=date)days=phase.weekdays;
 return [...days];
}
