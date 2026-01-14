# CodeHome 在线笔记

一个基于 Vue 3 + Vite 的在线 Markdown 笔记应用，支持多文件夹管理、搜索、分享、下载等功能，并通过 Authing 做用户登录。

## 技术栈

- Vue 3
- Vite
- Vue Router 4
- Axios
- mavon-editor（Markdown 编辑器）
- Authing（用户认证）

## 开发环境准备

```bash
# 安装依赖
npm install

# 本地开发启动
npm run dev

# 构建生产环境
npm run build
```

## 环境变量配置

项目使用 Vite 的环境变量机制，所有前端可用变量以 `VITE_` 开头。

1. 复制示例文件：

```bash
cp .env.example .env
```

2. 根据自己的 Authing 应用配置修改 `.env`：

```env
VITE_AUTHING_APP_ID=你的Authing应用AppId
VITE_AUTHING_USER_POOL_ID=你的Authing用户池ID
```

> 注意：`.env` 已在 `.gitignore` 中忽略，请不要把真实的密钥提交到仓库。

## Authing 集成说明

Authing 相关配置封装在 [authing.js](file:///f:/gcz/codeHome/src/utils/authing.js#L1-L9) 中：

- 从 `import.meta.env` 中读取 `VITE_AUTHING_APP_ID` 和 `VITE_AUTHING_USER_POOL_ID`
- 统一创建 `sdk` 实例，供 `Home.vue`、`Login.vue` 等页面使用

如需调整域名或回调地址，可在 `src/utils/authing.js` 中修改：

- `domain: 'https://mynote.authing.cn'`
- `redirectUri`：开发环境默认 `http://127.0.0.1:5173`，生产环境为 `https://note.momen.vip`

## 主要功能说明

- 文件夹管理：按文件夹组织笔记
- 笔记列表：按分页展示当前文件夹下的笔记
- 搜索：支持按标题关键字搜索（带清空图标）
- Markdown 编辑与预览：基于 mavon-editor，支持常用编辑工具栏
- 分享：生成带分享密码的链接
- 下载：将笔记内容导出为 `.md` 文件
- 登录：基于 Authing 的跳转登录 / 静默登录

## 目录结构（简要）

- `src/views/Home.vue`：主笔记页面
- `src/views/Login.vue`：登录/回调页面
- `src/views/unLogin.vue`：未登录引导页面
- `src/views/Share.vue`：分享查看页面
- `src/router/index.js`：路由配置
- `src/service/index.js`：接口封装
- `src/utils/authing.js`：Authing SDK 封装
- `src/utils/axios.js`：Axios 实例封装

## 开发建议

- 推荐使用 VS Code + Volar 插件进行开发
- 修改环境变量后，需要重新启动 `npm run dev`
