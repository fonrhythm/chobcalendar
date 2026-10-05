const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('native client loads without browser APIs; calendar handles regions, multiple filters and deep sharing',async()=>{
 const root=path.resolve(__dirname,'../client'),storage={},app={globalData:{feed:null}},pages=[],cache={};
 const raw={records:[{id:'event-1',name:'Artist',date:'2026-10-05',end_date:'2026-10-07',region:'thailand',activity:'Event',kind:'event',artist_ids:['artist'],images:['https://pbs.twimg.com/test.jpg'],category:'actor'}],artists:[{id:'artist',name:'Artist',company:'Company',categories:['演员']}],conditions:[],types:[]};
 let navigatedUrl='';const wx={getStorageSync:k=>storage[k],setStorageSync:(k,v)=>storage[k]=v,removeStorageSync:k=>delete storage[k],stopPullDownRefresh(){},setNavigationBarTitle(){},navigateTo(options){navigatedUrl=options.url},request(o){o.success({statusCode:200,data:raw})}};
 function load(f){f=path.resolve(f);if(cache[f])return cache[f].exports;const module={exports:{}};cache[f]=module;vm.runInNewContext(fs.readFileSync(f,'utf8'),{module,exports:module.exports,require:p=>load(path.resolve(path.dirname(f),p.endsWith('.js')?p:p+'.js')),wx,getApp:()=>app,Page:p=>pages.push(p),console,setTimeout,clearTimeout},{filename:f});return module.exports}
 const feed=await load(root+'/lib/feed.js').load(true);assert.equal(feed.records[0].images.length,1);
 for(const name of ['calendar','detail','account','submit','correction','about'])load(root+'/pages/'+name+'/index.js');assert.equal(pages.length,6);
 const calendar=pages[0];calendar.data=structuredClone(calendar.data);calendar.setData=d=>Object.assign(calendar.data,d);calendar.feed=feed;calendar.data.date='2026-10-05';calendar.render();assert.equal(calendar.data.groups[0].events.length,1);
 calendar.data.selectedCompanies=['Other'];calendar.render();assert.equal(calendar.data.groups[0].events.length,0);calendar.data.selectedCompanies=['Company','Other'];calendar.render();assert.equal(calendar.data.groups[0].events.length,1);
 calendar.data.view='week';calendar.render();assert.equal(calendar.data.groups.length,7);calendar.data.region='china';calendar.render();assert.ok(calendar.data.groups.every(g=>!g.events.length));
 // Exercise the actual calendar -> encoded URL -> WeChat onLoad chain.
 calendar.data.region='thailand';calendar.data.view='day';calendar.render();
 const clicked=calendar.data.groups[0].events[0];
 calendar.open({currentTarget:{dataset:{id:clicked.id}}});
 assert.equal(navigatedUrl,'/pages/detail/index?id='+encodeURIComponent(clicked.id));
 // WeChat passes the percent-encoded query value to onLoad unchanged.
 const routeId=navigatedUrl.split('?id=')[1];assert.ok(routeId.includes('%3A'));
 const detail=pages[1];detail.data=structuredClone(detail.data);detail.setData=d=>Object.assign(detail.data,d);
 detail.onLoad({id:routeId});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(detail.id,clicked.id);assert.equal(detail.data.error,'');assert.equal(detail.data.event.id,clicked.id);
 const shareId=detail.onShareAppMessage().path.split('?id=')[1];
 detail.onLoad({id:shareId});await new Promise(resolve=>setImmediate(resolve));assert.equal(detail.data.event.id,clicked.id);
 detail.onLoad({id:clicked.id});await new Promise(resolve=>setImmediate(resolve));assert.equal(detail.data.event.id,clicked.id);
 assert.equal(load(root+'/shared/records.js').safeUrl('javascript:alert(1)'),'');
});
