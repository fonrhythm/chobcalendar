export function matchesScheduleRegion(record,filter='all') {
 if (!['china','thailand','oversea'].includes(record.region)) return false;
 return filter==='all' || (filter==='thailand' ? record.region==='thailand' : filter==='oversea' && ['china','oversea'].includes(record.region));
}
export function legacyScheduleFilter(hash){return hash==='thailand'?'thailand':['china','oversea'].includes(hash)?'oversea':'all';}
