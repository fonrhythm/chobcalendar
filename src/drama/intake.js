// Separate from Schedule event submissions. A failed request never clears the draft.
export function createDramaIntake(call){
 return async ({id,kind,payload,seriesId=null})=>{
  if(!id||!['addition','correction'].includes(kind))throw Error('投稿类型或编号无效');
  if(kind==='correction'&&(!seriesId||!payload?.message?.trim()))throw Error('请填写纠错说明');
  return await call('chob_submit_drama',{request_id:id,submission_kind:kind,proposal:payload,target_series:seriesId});
 };
}
