import {defineConfig} from 'vite';
import base from './vite.config.js';
import {dramaLocalData} from './scripts/dramaLocalData.js';
export default defineConfig(env=>{
 const config=base(env),data=dramaLocalData(false);
 data.configurePreviewServer=data.configureServer;
 return {...config,plugins:[...config.plugins,data],define:{'import.meta.env.DEV':true},build:{outDir:'dist-private-preview'},preview:{host:'127.0.0.1',port:4183,strictPort:true}};
});
