const config=require('../config');
let refreshing=null,generation=0;
function request(url,data,method='POST',headers={}){return new Promise((resolve,reject)=>wx.request({url,data,method,header:{'content-type':'application/json',...headers},timeout:30000,success:r=>{if(r.statusCode>=200&&r.statusCode<300)resolve(r.data);else reject(Object.assign(Error(r.data?.message||r.data?.error_description||r.data?.error||'Request failed'),{status:r.statusCode}))},fail:reject}))}
function session(){return wx.getStorageSync('chob-session')||null}
function persist(s){if(s)wx.setStorageSync('chob-session',{...s,expires_at:s.expires_at||Math.floor(Date.now()/1000)+s.expires_in});else wx.removeStorageSync('chob-session')}
function save(s){generation++;refreshing=null;persist(s)}
function authError(){return Object.assign(Error('请先登录'),{status:401})}
async function token(){const s=session();if(!s)return null;if(s.expires_at>Date.now()/1000+60)return s.access_token;
 if(refreshing)return refreshing;
 const version=generation;
 const pending=request(config.supabaseUrl+'/auth/v1/token?grant_type=refresh_token',{refresh_token:s.refresh_token},'POST',{apikey:config.publishableKey}).then(next=>{if(version!==generation)throw authError();if(!next.access_token||!next.refresh_token||next.user?.id!==s.user.id)throw authError();persist(next);return next.access_token}).catch(e=>{if(version===generation&&(e.status===400||e.status===401)){save(null);e.status=401}throw e}).finally(()=>{if(refreshing===pending)refreshing=null});refreshing=pending;return pending;
}
async function authenticated(url,data,method='POST'){const t=await token();if(!t)throw authError();const version=generation;try{const result=await request(url,data,method,{apikey:config.publishableKey,Authorization:'Bearer '+t});if(version!==generation)throw authError();return result}catch(e){if(e.status===401&&version===generation)save(null);throw e}}
function rpc(name,args={},auth=false){const url=config.supabaseUrl+'/rest/v1/rpc/'+name;return auth?authenticated(url,args):request(url,args,'POST',{apikey:config.publishableKey})}
function rows(table,filter){return authenticated(config.supabaseUrl+'/rest/v1/'+table+'?'+filter,null,'GET')}
async function login(linkCode=''){if(!config.workerUrl)throw Error('微信登录服务尚未部署，请配置 Worker 域名');const version=generation;const code=await new Promise((resolve,reject)=>wx.login({success:r=>r.code?resolve(r.code):reject(Error('微信登录失败')),fail:reject}));if(version!==generation)throw authError();const s=await request(config.workerUrl+(linkCode?'/bind':'/login'),{code,...(linkCode?{link_code:linkCode.trim()}:{})});if(version!==generation)throw authError();if(!s.access_token||!s.refresh_token||!s.user?.id)throw Error('登录响应无效');save(s);return s}
async function logout(){const s=session();save(null);if(!s)return;const headers={apikey:config.publishableKey,Authorization:'Bearer '+s.access_token};const results=await Promise.allSettled([request(config.supabaseUrl+'/rest/v1/rpc/chob_wechat_logout',{},'POST',headers),request(config.supabaseUrl+'/auth/v1/logout?scope=local',{},'POST',headers)]);if(results.every(r=>r.status==='rejected'))throw Error('本机已退出，服务端退出未完成，请检查网络')}
function requireLogin(action=''){wx.navigateTo({url:'/pages/account/index'+(action?'?action='+encodeURIComponent(action):'')})}
module.exports={rpc,rows,login,logout,session,save,request,token,requireLogin};
