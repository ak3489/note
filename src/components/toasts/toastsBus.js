/**
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-17 17:00:26
 * @LastEditors: gcz
 * @LastEditTime: 2022-11-17 17:00:28
 * @FilePath: \codeHome\src\components\toasts\toastsBus.js
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
 */
 import emitter from 'tiny-emitter/instance'

 export default {
     $on: (...args) => emitter.on(...args),
     $once: (...args) => emitter.once(...args),
     $off: (...args) => emitter.off(...args),
     $emit: (...args) => emitter.emit(...args)
 }