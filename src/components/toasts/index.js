/**
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-17 16:59:59
 * @LastEditors: gcz
 * @LastEditTime: 2022-11-17 17:00:01
 * @FilePath: \codeHome\src\components\toasts\index.js
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
 */
 import toast from './instance'
 import Toast from './toasts.vue'
 
 export default (app) => {
     app.component(Toast.name, Toast);
     app.config.globalProperties.$Toast = toast;
 }