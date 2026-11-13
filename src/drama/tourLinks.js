import {normalizeRecord,safeUrl} from '../utils/records.js';
// Linked Schedule records remain authoritative; only unlinked tours need preview rows.
export function tourPreviewEvents(events){return events.filter(e=>!e.eventId).flatMap(event=>(event.stops?.length?event.stops:[event]).map((stop,i)=>({
 ...normalizeRecord({id:'drama-test:'+event.id+':'+i,name:stop.content||event.name,date:event.date,time:stop.time||event.time,region:event.region||'thailand',kind:'event',type:'press',activity_type:'press',venue:stop.location||event.location||'',artist_ids:event.artistIds||[]},i,'demo'),
 dramaPreview:true,dramaId:event.dramaId,images:(event.images||[]).map(safeUrl).filter(Boolean)
})));}
export function linkedSeriesForEvent(events,eventId){const raw=String(eventId||'').replace(/^supabase:/,'');return [...new Set(events.filter(e=>e.eventId===raw).map(e=>e.dramaId))];}
