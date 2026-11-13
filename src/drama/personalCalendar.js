import {broadcastRows} from './library.js';
// Pure read model: never writes favorites, events or episode schedules.
// Event channel classification is supplied by the existing Schedule adapter.
export function projectPersonalCalendar({events=[],dramas=[],changes=[],eventIds=[],dramaIds=[],classifyEvent}){
 const chosenEvents=new Set(eventIds),chosenDramas=new Set(dramaIds),rows=new Map();
 for(const event of events){if(!chosenEvents.has(event.id))continue;const channel=classifyEvent(event);if(!['offline','live'].includes(channel))continue;rows.set('event:'+event.id,{...event,calendarKey:'event:'+event.id,channel});}
 for(const drama of dramas){if(!chosenDramas.has(drama.id))continue;for(const slot of broadcastRows(drama,changes)){const key='drama:'+slot.id;rows.set(key,{...slot,calendarKey:key,channel:'drama',title:drama.titleZh||drama.titleEn||drama.titleTh,types:[...(drama.types||[])],seriesId:drama.id});}}
 return [...rows.values()].sort((a,b)=>a.date.localeCompare(b.date)||String(a.time||'').localeCompare(String(b.time||''))||a.calendarKey.localeCompare(b.calendarKey));
}
export function filterPersonalCalendar(rows,channels=['offline','live','drama']){const selected=new Set(channels);return rows.filter(row=>selected.has(row.channel));}
