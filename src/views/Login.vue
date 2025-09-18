<!--
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-17 10:52:43
 * @LastEditors: gcz
 * @LastEditTime: 2024-08-21 10:22:07
 * @FilePath: \codeHome\src\views\Login.vue
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
-->
<template>
    <h2>登录页</h2>
    
  </template>
  
  <script setup>
  import { ref,onMounted,watch,getCurrentInstance,reactive,toRefs  } from 'vue';
import { Authing } from '@authing/web';
const sdk = new Authing({
  // 应用的认证地址，例如：https://domain.authing.cn
  domain: 'https://mynote.authing.cn',
  appId: '6376fb5d2d8111d6673ed0fc',
  // 登录回调地址，需要在控制台『应用配置 - 登录回调 URL』中指定
  // redirectUri: 'http://127.0.0.1:5173/login',
  redirectUri: process.env.NODE_ENV == 'development' ? 'http://127.0.0.1:5173' : 'https://note.momen.vip',
  // redirectUri: 'https://note.momen.vip',
  userPoolId:'6376fb022996db9f5c2396ba',//用户池id
});
const state = reactive({
  loginState: null,
  userInfo: null,
});

/**
 * 获取用户的登录状态
 */
const getLoginState = async () => {
  const res = await sdk.getLoginState();
  console.log('获取用户的登录状态',res);
  state.loginState = res;
  if (!res) {
    console.log('111111')
    sdk.loginWithRedirect();
  }else{
    console.log('22222')
    getUserInfo()
  }
};

/**
 * 以跳转方式打开 Authing 托管的登录页
 */
const login = () => {
  sdk.loginWithRedirect();
};

/**
 * 用 Access Token 获取用户身份信息
 */
const getUserInfo = async () => {
  console.log('state==========',state)
  console.log('state.userInfo',state.userInfo)
  if (!state.loginState||(!state.userInfo||state.userInfo.statusCode===401)) {
    alert("用户未登录");
    login();
    return;
  }
  console.log('sdk.getUserInfo',sdk.getUserInfo);
  const userInfo = await sdk.getUserInfo({
    accessToken: state.loginState.accessToken,
  });
  console.log('userInfo',userInfo);
  localStorage.setItem('userInfo',userInfo)
  state.userInfo = userInfo;
  window.location.replace("/");
};
onMounted(async () => {
   // 校验当前 url 是否是登录回调地址
   if (sdk.isRedirectCallback()) {
    console.log("redirect");

    /**
     * 以跳转方式打开 Authing 托管的登录页，认证成功后，
     * 需要配合 handleRedirectCallback 方法，在回调端点处理 Authing 发送
     * 的授权码或 token，获取用户登录态
     */
    sdk.handleRedirectCallback().then((res) => {
      state.loginState = res;
      window.location.replace("/");
    });
  } else {
    console.log("normal");

    // 静默登录，直接获取到用户信息
    getLoginState();
  }
  console.log(`the component is now mounted.`);
})

  </script>
  
  <style>

  </style>