import {addDays,dateKey,parseDate} from './dates.js';
export function feedWindow(month){const first=month+'-01',next=parseDate(first);next.setMonth(next.getMonth()+1);return {start:addDays(first,-7),end:addDays(dateKey(next),6)}}
export async function loadFeedPages(call,args,signal){
const result={records:[],artists:[],announcements:[]},artists=new Map(),notices=new Map();let page=0;
for(let n=0;n<20;n++){
const feed=await call('chob_public_feed',{...args,page},signal);result.records.push(...feed.records);for(const a of feed.artists||[])artists.set(a.id,a);for(const a of feed.announcements||[])notices.set(a.id,a);result.types=feed.types;result.conditions=feed.conditions;
if(feed.next_page===null||feed.next_page===undefined){result.artists=[...artists.values()];result.announcements=[...notices.values()];return result}
if(!Number.isSafeInteger(feed.next_page)||feed.next_page<=page)throw Error('日历分页响应无效');page=feed.next_page;
}
throw Error('当前日期范围活动过多，请缩小范围。');
}
