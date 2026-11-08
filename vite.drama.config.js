import {dramaLocalData} from './scripts/dramaLocalData.js';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[dramaLocalData(false),vue()],server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'},build:{outDir:'dist-drama-preview',rollupOptions:{input:'drama-preview.html'}}});
