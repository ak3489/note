import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
// 引入全局样式文件
import '@/assets/scss/index.scss'

// https://github.com/hinesboy/mavonEditor#readme
import mavonEditor from 'mavon-editor';
import 'mavon-editor/dist/css/index.css';

import toasts from './components/toasts'

import { s3Layer,layer } from 'vue3-layer';
import 'vue3-layer/dist/s3Layer.css';

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'



const app = createApp(App) // 创建实例
app.component('s3-layer', s3Layer);
app.use(mavonEditor)
app.use(router)
app.use(toasts)
app.use(ContextMenu)
app.mount('#app')