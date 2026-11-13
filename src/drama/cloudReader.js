let catalogCache=null;
async function artistCatalog(client,uid){if(catalogCache?.uid===uid&&Date.now()-catalogCache.at<300000)return catalogCache.rows;const rows=[];for(let offset=0;;offset+=500){const result=await client.from('artists').select('id,name,en_name,aliases,company,deleted_at').is('deleted_at',null).order('id').range(offset,offset+499);if(result.error)throw Error(result.error.message);rows.push(...result.data);if(result.data.length<500)break;}catalogCache={uid,at:Date.now(),rows};return rows;}
// Private preview reader. RLS denies this snapshot to anonymous/non-admin users.
export async function readPrivateDrama(client){
 if(!client)throw Error('私有预览尚未配置登录服务');
 const session=await client.auth.getSession();
 if(!session.data.session)throw Error('请先使用管理员账号登录，才能预览私有剧集资料');
 const profile=await client.from('users').select('role,is_active,email_verified').eq('id',session.data.session.user.id).single();
 if(profile.error)throw Error(profile.error.message);
 if(profile.data?.role!=='admin'||!profile.data?.is_active||!profile.data?.email_verified)throw Error('Drama 私有预览仅向管理员开放');
 const tables=['drama_series','drama_notices','drama_event_links','drama_platforms'];
 const results=await Promise.all(tables.map(t=>client.from(t).select('*')));
 for(const r of results)if(r.error)throw Error(r.error.message);
 const [series,notices,events,platforms]=results.map(r=>r.data);
 return {dramas:series.filter(r=>r.state!=='archived').map(r=>({...r.data,id:r.id,_version:r.version})),changes:notices.map(r=>r.change),events:events.map(r=>({...r.data,id:r.id,dramaId:r.series_id,eventId:r.event_id})),platforms,artists:await artistCatalog(client,session.data.session.user.id)};
}

export async function readPublicDrama(client){
 if(!client)throw Error('剧集数据服务尚未配置');
 const result=await client.rpc('chob_drama_public_feed');
 if(result.error)throw Error(result.error.message);
 return result.data;
}
