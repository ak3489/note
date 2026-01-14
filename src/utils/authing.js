import { Authing } from '@authing/web';

const appId = import.meta.env.VITE_AUTHING_APP_ID;
const userPoolId = import.meta.env.VITE_AUTHING_USER_POOL_ID;

export const sdk = new Authing({
  domain: 'https://mynote.authing.cn',
  appId,
  redirectUri: process.env.NODE_ENV == 'development' ? 'http://127.0.0.1:5173' : 'https://note.momen.vip',
  userPoolId,
});
