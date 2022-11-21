/**
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-17 10:50:15
 * @LastEditors: gcz
 * @LastEditTime: 2022-11-18 14:04:36
 * @FilePath: \codeHome\src\router\index.js
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
 */
 import { createRouter, createWebHashHistory,createWebHistory } from 'vue-router'

 const router = createRouter({
   history: createWebHistory(), // hash模式：createWebHashHistory，history模式：createWebHistory
   routes: [
     {
       path: '/',
       redirect: '/home'
     },
     {
       path: '/home',
       name: 'home',
       component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
       meta: {
         index: 1
       }
     },
     {
       path: '/login',
       name: 'login',
       component: () => import(/* webpackChunkName: "login" */ '@/views/Login.vue'),
       meta: {
         index: 1
       }
     },
   ]
 })
 
 export default router