/**
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-17 15:48:03
 * @LastEditors: gcz
 * @LastEditTime: 2023-01-17 10:04:35
 * @FilePath: \codeHome\src\service\index.js
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
 */

 import axios from '../utils/axios'

 export function getUserInfo() {
   return axios.get('/user/info');
 }

export function getFolders(userId) {
  return axios.get(`/code/getFolders?userId=${userId}`);
}
export function getCodeList(folderId,pageNo,pageSize) {
  return axios.get(`/code/getCodeList?folderId=${folderId}&pageNo=${pageNo}&pageSize=${pageSize}`);
}
export function seachCodeApi(userId, keyword) {
  return axios.get(`/code/seachCode?userId=${userId}&keyword=${keyword}`);
}
export function getCode(codeId, isClick) {
  return axios.get(`/code/getCode?codeId=${codeId}&isClick=${isClick}`);
}
export function getShareCode(codeId, notePass) {
  return axios.get(`/code/getShareCode?codeId=${codeId}&notePass=${notePass}`);
}
export function changeCodeTitle(params) {
  return axios.post(`/code/changeCodeTitle`, params);
}

export function addFolderApi(params) {
  return axios.post('/code/addFolder', params);
}
export function editFolderApi(params) {
  return axios.post(`/code/editFolder`,params);
}
export function delFolderApi(id) {
  console.log('idid', id);
  return axios.post(`/code/delFolder`, { id: id });
}

export function addCodeApi(params) {
  return axios.post('/code/addCode', params);
}

export function saveCodeApi(params) {
  return axios.post(`/code/saveCode`,params);
}

export function setSharePass(params) {
  return axios.post(`/code/setSharePass`, params);
}

export function delCodeApi(id) {
  return axios.post(`/code/delCode`,{id:id});
}
 
//  export function EditUserInfo(params) {
//    return axios.put('/user/info', params);
//  }
 
//  export function login(params) {
//    return axios.post('/user/login', params);
//  }
 
//  export function logout() {
//    return axios.post('/user/logout')
//  }
 
//  export function register(params) {
//    return axios.post('/user/register', params);
//  }
