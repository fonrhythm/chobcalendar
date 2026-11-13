import {validateDrama,generateSchedule} from './schedule.js';
import {normalizeSearch} from '../utils/artistFilters.js';
export function dramaMatchesSearch(drama,query){const needle=normalizeSearch(query);return !needle||normalizeSearch([drama.titleZh,drama.titleEn,drama.titleTh,...(drama.types||[]).flatMap(type=>[type,({'Boys Love':'BL','Girls Love':'GL','群像':'Ensemble','其他':'Other'})[type]])].filter(Boolean).join(' ')).includes(needle);}
export function platformToday(now=new Date(),timezone='Asia/Bangkok'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function clampLibraryPage(page,total,pageSize=30){return Math.min(Math.max(1,Number.isFinite(page)?Math.trunc(page):1),Math.max(1,Math.ceil(total/pageSize)));}

export function validateDramaSnapshot(snapshot){
 for(const key of ['dramas','changes','events','platforms','artists'])if(!Array.isArray(snapshot?.[key]))throw Error('剧集资料格式异常，请刷新重试');
 const ids=new Set();for(const drama of snapshot.dramas){if(!drama.id||ids.has(drama.id)||!Array.isArray(drama.rules)||!Array.isArray(drama.cast)||!Array.isArray(drama.types))throw Error('剧集资料格式异常，请刷新重试');ids.add(drama.id);try{validateDrama(drama);for(const rule of drama.rules)generateSchedule(drama,rule);}catch(e){throw Error((drama.titleZh||drama.titleEn||drama.id)+': '+e.message);}}
 for(const change of snapshot.changes)if(!change?.original||!change?.replacement||!change?.announcement||!Array.isArray(change.announcement.affectedEpisodes))throw Error('剧集变动资料格式异常，请刷新重试');
 return snapshot;
}
