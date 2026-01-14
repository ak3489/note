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
  <div class="login-page">
    <h2>正在跳转登录...</h2>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { sdk } from '@/utils/authing';

const state = reactive({
  loginState: null,
  userInfo: null,
});

const getLoginState = async () => {
  try {
    const res = await sdk.getLoginState();
    state.loginState = res;
    if (!res) {
      sdk.loginWithRedirect();
    } else {
      getUserInfo();
    }
  } catch (error) {
    console.error('Failed to get login state:', error);
    sdk.loginWithRedirect();
  }
};

const getUserInfo = async () => {
  if (!state.loginState) {
    sdk.loginWithRedirect();
    return;
  }
  
  try {
    const userInfo = await sdk.getUserInfo({
      accessToken: state.loginState.accessToken,
    });
    
    if (userInfo && userInfo.statusCode !== 401) {
       // Only store minimal info if needed, but Home.vue fetches it again.
       // Keeping it consistent with previous logic but fixing the bug.
       localStorage.setItem('userInfo', JSON.stringify(userInfo));
       state.userInfo = userInfo;
       window.location.replace("/");
    } else {
       sdk.loginWithRedirect();
    }
  } catch (error) {
    console.error('Get user info failed:', error);
    sdk.loginWithRedirect();
  }
};

onMounted(async () => {
  // Check if this is a redirect callback
  if (sdk.isRedirectCallback()) {
    sdk.handleRedirectCallback().then((res) => {
      state.loginState = res;
      window.location.replace("/");
    }).catch(err => {
      console.error('Handle redirect callback failed:', err);
      // Fallback to login check
      getLoginState();
    });
  } else {
    // Normal access, check login state
    getLoginState();
  }
});
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #fff;
  background-color: var(--bg-color, #1e1e1e); /* Use theme color or fallback */
}
</style>
