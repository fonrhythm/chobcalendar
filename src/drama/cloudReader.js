// Private preview reader. RLS denies this snapshot to anonymous/non-admin users.
export async function readPrivateDrama(client){
 if(!client)throw Error('私有预览尚未配置登录服务');
 const session=await client.auth.getSession();
 if(!session.data.session)throw Error('请先使用管理员账号登录，才能预览私有剧集资料');
 const tables=['drama_series','drama_notices','drama_event_links','drama_platforms'];
 const results=await Promise.all(tables.map(t=>client.from(t).select('*')));
 for(const r of results)if(r.error)throw Error(r.error.message);
 const [series,notices,events,platforms]=results.map(r=>r.data);
 return {dramas:series.filter(r=>r.state!=='archived').map(r=>({...r.data,id:r.id,_version:r.version})),changes:notices.map(r=>r.change),events:events.map(r=>({...r.data,id:r.id,dramaId:r.series_id})),platforms,artists:[]};
}
