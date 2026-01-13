<script setup>
import { ref,onMounted,watch,getCurrentInstance,reactive,onUnmounted  } from 'vue';
import { 
  // addFolderApi,
  getFolders,
  getCodeList,
  addCodeApi,
  getCode,
  saveCodeApi,
  delCodeApi,
  // editFolderApi,
  seachCodeApi,
  setSharePass,
  changeCodeTitle
} from '@/service/index';
import { Authing } from '@authing/web';
import { debounce } from '@/utils/debounce';
import { useRouter, useRoute } from 'vue-router'
import Pagination from '../components/pagination'
import Folders from '../components/Folders.vue'
const router = useRouter()
const route = useRoute()

// 列宽约束常量
const COLUMN_CONSTRAINTS = {
  minFoldersInfo: 200,  // 最小 200px
  maxFoldersInfo: 500,  // 最大 500px
  minList: 250,         // 最小 250px
  maxList: 600,         // 最大 600px
  minCode: 400          // 最小 400px
};

// 列宽状态管理
const columnWidths = ref({
  foldersInfo: 300,
  list: 400
});

// 移动端检测状态
const isMobile = ref(false);

// localStorage 持久化
const COLUMN_WIDTHS_KEY = 'note-app-column-widths';

function saveColumnWidths(widths) {
  try {
    const data = {
      foldersInfo: widths.foldersInfo,
      list: widths.list,
      version: 1
    };
    localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save column widths to localStorage:', error);
  }
}

function loadColumnWidths() {
  try {
    const saved = localStorage.getItem(COLUMN_WIDTHS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (data && typeof data.foldersInfo === 'number' && typeof data.list === 'number') {
        return {
          foldersInfo: data.foldersInfo,
          list: data.list
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load column widths from localStorage:', error);
  }
  return null;
}

// 拖拽状态管理
const resizerState = ref({
  isDragging: false,
  activeResizer: null,
  startX: 0,
  startWidths: { foldersInfo: 300, list: 400 }
});

// 拖拽交互逻辑
function startResize(resizer, event) {
  if (isMobile.value) return;
  
  resizerState.value = {
    isDragging: true,
    activeResizer: resizer,
    startX: event.clientX,
    startWidths: { ...columnWidths.value }
  };
  
  event.preventDefault();
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function onResize(event) {
  if (!resizerState.value.isDragging) return;
  
  const deltaX = event.clientX - resizerState.value.startX;
  const containerWidth = document.documentElement.clientWidth;
  
  if (resizerState.value.activeResizer === 'first') {
    // 调整第一列和第二列的宽度
    let newFoldersInfoWidth = resizerState.value.startWidths.foldersInfo + deltaX;
    
    // 应用约束
    newFoldersInfoWidth = Math.max(COLUMN_CONSTRAINTS.minFoldersInfo, 
                                  Math.min(COLUMN_CONSTRAINTS.maxFoldersInfo, newFoldersInfoWidth));
    
    // 确保第三列有足够空间
    const remainingWidth = containerWidth - newFoldersInfoWidth - columnWidths.value.list;
    if (remainingWidth >= COLUMN_CONSTRAINTS.minCode) {
      columnWidths.value.foldersInfo = newFoldersInfoWidth;
    }
  } else if (resizerState.value.activeResizer === 'second') {
    // 调整第二列和第三列的宽度
    let newListWidth = resizerState.value.startWidths.list + deltaX;
    
    // 应用约束
    newListWidth = Math.max(COLUMN_CONSTRAINTS.minList, 
                           Math.min(COLUMN_CONSTRAINTS.maxList, newListWidth));
    
    // 确保第三列有足够空间
    const remainingWidth = containerWidth - columnWidths.value.foldersInfo - newListWidth;
    if (remainingWidth >= COLUMN_CONSTRAINTS.minCode) {
      columnWidths.value.list = newListWidth;
    }
  }
}

function endResize() {
  if (resizerState.value.isDragging) {
    resizerState.value.isDragging = false;
    resizerState.value.activeResizer = null;
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // 保存列宽到 localStorage
    saveColumnWidths(columnWidths.value);
  }
}

// 响应式布局切换
function checkMobileView() {
  const clientWidth = document.documentElement.clientWidth;
  const wasMobile = isMobile.value;
  isMobile.value = clientWidth < 1200;
  
  // 从移动端切换回桌面端时恢复保存的列宽
  if (wasMobile && !isMobile.value) {
    const savedWidths = loadColumnWidths();
    if (savedWidths) {
      columnWidths.value = savedWidths;
    }
  }
}

function onWindowResize() {
  checkMobileView();
}

// URL 同步功能
function updateUrlNoteId(noteId) {
  if (noteId) {
    router.replace({ 
      path: route.path, 
      query: { ...route.query, noteId } 
    });
  } else {
    const { noteId: _, ...otherQuery } = route.query;
    router.replace({ 
      path: route.path, 
      query: otherQuery 
    });
  }
}

function getNoteIdFromUrl() {
  return route.query.noteId || null;
}
const sdk = new Authing({
  // 应用的认证地址，例如：https://domain.authing.cn
  domain: 'https://mynote.authing.cn',
  appId: '6376fb5d2d8111d6673ed0fc',
  // 登录回调地址，需要在控制台『应用配置 - 登录回调 URL』中指定
  // redirectUri: 'http://127.0.0.1:5173',
  // redirectUri: 'https://note.momen.vip',
  redirectUri: process.env.NODE_ENV == 'development' ? 'http://127.0.0.1:5173' : 'https://note.momen.vip',
  userPoolId:'6376fb022996db9f5c2396ba',//用户池id
});
const state = reactive({
  loginState: null,
  userInfo: {},
});

/**
 * 获取用户的登录状态
 */
const getLoginState = async () => {
  const res = await sdk.getLoginState();
  // console.log('获取用户的登录状态',res);
  state.loginState = res;
  if (!res) {
    router.push({ path: '/unlogin' })
    // sdk.loginWithRedirect();
  }else{
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
  if (!state.loginState) {
    alert("用户未登录");
    return;
  }
  // console.log('sdk.getUserInfo',sdk.getUserInfo);
  const userInfo = await sdk.getUserInfo({
    accessToken: state.loginState.accessToken,
  });
  // console.log('userInfo',userInfo);
  if(userInfo.statusCode===401){
    //跳转到unLogin页面
    router.push({ path: '/unlogin' })
    // sdk.loginWithRedirect();
  }
  // addFolderForm.value.userId=userInfo.userId;
  addCodeForm.value.userId=userInfo.userId
  state.userInfo = userInfo;
  handleGetFolders()
};

/**
 * 登出
 */
  const logout = () => {
  sdk.logoutWithRedirect({redirectUri: process.env.NODE_ENV == 'development' ? 'http://127.0.0.1:5173/unlogin' : 'https://note.momen.vip/unlogin'});
};

const instance = getCurrentInstance()
let toast
let toastObject = ref({
  type:'warning',
  title:'提示',
  message:'内容',
  autoClose:4500
})
function clickHandle(){
  toast = instance.appContext.config.globalProperties.$Toast({
      type: toastObject.value.type,
      title: toastObject.value.title,
      message: toastObject.value.message,
      autoClose: toastObject.value.autoClose,
      confirmText: null,
      confirmHandle: () => {
          // alert('阅读完成!')
      },
      leaveHandle: () => {
          // alert('Toasts 离开了')
      }
  })
}
// 主动关闭
function closeHandle(){
    if(toast)
    toast.close();
}

let folderIndex = ref(0);
let folderList = ref([]);
let isFolderClick = ref(false);
// function folderClick(item,index){
//   queryParams.value.pageNo = 1;
//   folderIndex.value = index
// }

function onFolderClick(e){
  isFolderClick.value = true;
  queryParams.value.pageNo = 1;
  folderIndex.value = e;
  keyword.value = '';
  // console.log('onFolderClick',e);
}

let codeIndex = ref(0);
let codeList = ref([]);
function codeClick(item,index){
  activeCode.value = item;
  codeIndex.value = index;
  updateUrlNoteId(item._id);
  handleGetCode(activeCode.value._id,'click')
}

let activeCode = ref({
  folderId:'',
  noteContent:'',
  noteTitle:'',
  _id:''
});
let toolbars = {
      bold: true, // 粗体
      italic: true, // 斜体
      header: true, // 标题
      underline: true, // 下划线
      strikethrough: true, // 中划线
      mark: true, // 标记
      superscript: true, // 上角标
      subscript: true, // 下角标
      quote: true, // 引用
      ol: true, // 有序列表
      ul: true, // 无序列表
      link: true, // 链接
      imagelink: true, // 图片链接
      code: true, // code
      table: true, // 表格
      fullscreen: true, // 全屏编辑
      readmodel: true, // 沉浸式阅读
      htmlcode: true, // 展示html源码
      help: true, // 帮助
      /* 1.3.5 */
      undo: true, // 上一步
      redo: true, // 下一步
      trash: true, // 清空
      save: true, // 保存（触发events中的save事件）
      /* 1.4.2 */
      navigation: true, // 导航目录
      /* 2.1.8 */
      alignleft: true, // 左对齐
      aligncenter: true, // 居中
      alignright: true, // 右对齐
      /* 2.2.1 */
      subfield: true, // 单双栏模式
      preview: true, // 预览
  }
async function saveCode(){
  console.log('activeCode',activeCode.value);
  console.log('activeCode.value',activeCode.value);
  if(!activeCode.value._id){layer.msg('请先新增笔记,或者稍后再试!'); return}
  let {code,data,msg} = await saveCodeApi(activeCode.value);
  layer.msg(msg);
  // 保存成功后更新原始内容并隐藏保存按钮
  if(code === 200) {
    originalContent.value = activeCode.value.noteContent || '';
    hasContentChanged.value = false;
  }
};

async function handleGetFolders(){
  let userId = state.userInfo?.userId;
  // console.log('showLoading.value',showLoading.value);
  // setTimeout(()=>{
    showLoading.value = true
  // },100)
  let {code,data,msg} = await getFolders(userId);
  folderList.value = data;
  handleGetCodeList()
}
let queryParams = ref({
  pageNo: 1,
  pageSize: 20,
})
let total = ref(1)
async function handleGetCodeList(){
  let folderId = folderList.value[folderIndex.value]?._id;
  // console.log('folderId',folderId);
  let {code,data,totalCount,msg} = await getCodeList(folderId,queryParams.value.pageNo,queryParams.value.pageSize);
  codeList.value = data;
  total.value = totalCount;
  showLoading.value = false;
  activeCode.value = {};
  
  if(data.length>0){
    // 检查 URL 中是否有 noteId
    const urlNoteId = getNoteIdFromUrl();
    let selectedIndex = 0;
    let selectedNoteId = data[0]._id;
    
    // 如果 URL 有 noteId 且在当前列表中存在，选中该笔记
    if (urlNoteId) {
      const foundIndex = data.findIndex(note => note._id === urlNoteId);
      if (foundIndex !== -1) {
        selectedIndex = foundIndex;
        selectedNoteId = urlNoteId;
      } else {
        // URL 中的 noteId 不存在，更新 URL 为第一个笔记
        updateUrlNoteId(selectedNoteId);
      }
    } else {
      // URL 中没有 noteId，更新 URL 为第一个笔记
      updateUrlNoteId(selectedNoteId);
    }
    
    codeIndex.value = selectedIndex;
    handleGetCode(selectedNoteId);
  } else {
    // 文件夹为空时，清除 URL 中的 noteId
    updateUrlNoteId(null);
    codeIndex.value = 0;
  }
  // console.log('codeList.value',codeList.value);
}

function changePage($event){
  console.log('$event',$event);
  queryParams.value.pageNo = $event;
  handleGetCodeList()
}

async function handleGetCode(codeId,isClick){
  let {code,data,msg} = await getCode(codeId,isClick);
  activeCode.value = data;
  // 保存原始内容，用于检测变化
  originalContent.value = data.noteContent || '';
  hasContentChanged.value = false;
}

let codeOperateType = ref('add');
let showAddCode = ref(false);
let addCodeForm = ref(
  {noteTitle:'',folderId:'',noteContent:''}
);
let editCodeForm = ref({noteTitle:'',codeId:''})
async function confirmAddCode(){
  if(codeOperateType.value == 'add'){
    // console.log('addCodeForm',addCodeForm.value);
    let {code,data,msg} = await addCodeApi(addCodeForm.value);
    layer.msg(msg);
    handleGetCodeList()
    showAddCode.value = false

  }else if(codeOperateType.value == 'edit'){
    console.log('editCodeForm',editCodeForm.value);
    let {code,data,msg} = await changeCodeTitle(editCodeForm.value);
    layer.msg(msg);
    handleGetCodeList()
    showAddCode.value = false

  }
}
function addCode(){
  codeOperateType.value = 'add';
  // console.log('folderList',folderList.value.length);
  console.log('folderList',folderList.value[folderIndex.value]);
  if(folderList.value.length<1){
    // alert('请选新增类别')
    toastObject.value.type = 'error';
    toastObject.value.title = '错误';
    toastObject.value.message = '请先新增文件夹';
    clickHandle();
  }else{
    addCodeForm.value.folderId = folderList.value[folderIndex.value]._id;
    console.log('addCodeForm',addCodeForm.value);
    showAddCode.value = true
  }
}

function editCodeTitle(item){
  codeOperateType.value = 'edit';
  showAddCode.value = true;
  editCodeForm.value.noteTitle = item.noteTitle;
  editCodeForm.value.codeId = item._id;
}

let delCodeId = ref('')
let showDelCode = ref(false)
function delCode(id){
  delCodeId.value = id;
  showDelCode.value = true;
}

async function confirmDelCode(){
  let {code,msg} = await delCodeApi(delCodeId.value)
  layer.msg(msg)
  if(code==200){
    handleGetCodeList();
  }
}

onMounted(async () => {
    // 加载保存的列宽
    const savedWidths = loadColumnWidths();
    if (savedWidths) {
      columnWidths.value = savedWidths;
    }
    
    // 初始化移动端检测
    checkMobileView();
    
    // 添加全局拖拽事件监听
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', endResize);
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', onWindowResize);
    
    let clientWidth = document.documentElement.clientWidth;
    if(clientWidth<1200){
      subfield.value = false
      defaultOpen.value = 'edit'
    }
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
    // console.log("normal");
    // 静默登录，直接获取到用户信息
    getLoginState();
  }
  // console.log(`the component is now mounted.`);
  
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', endResize);
  window.removeEventListener('resize', onWindowResize);
});


watch(folderIndex, (newVal, oldVal) => { 
  // console.log(newVal)
  // codeIndex.value = 0;
  handleGetCodeList()
})

// watch(codeIndex, (newVal, oldVal) => { 
//   console.log('codeIndex',newVal)
//   console.log('',codeList.value[newVal]);
//   // handleGetCode(activeCode.value._id)
// },{immediate:true})

let keyword = ref('');
async function seachCode(){
  let userId = state.userInfo?.userId;
  let {code,data,msg} = await seachCodeApi(userId,keyword.value);
  codeList.value = data
}
// watch(keyword, (newVal, oldVal) => { 
//   // console.log('keyword',newVal)
//   // console.log('keyword.value.length',keyword.value.length);
//   // console.log('!isFolderClick.value',!isFolderClick.value);
//   // if(!isFolderClick.value){
//   //   debounce(seachCode(), 500, false);
//   // }else{
//   //   handleGetCodeList()
//   // }
// })


function keywordChange(e){
  if (!e.isComposing) {
    // console.log('keyword',keyword.value);
    if(keyword.value){
      debounce(seachCode(), 500, false);
    }else{
      handleGetCodeList()
    }
    // console.log('当前输入的内容：', keyword);
  }
}

let showLoading = ref(false);

function share(item){
  // console.log('window.location.host',window.location.host);
  // console.log('activeCode.value._id',activeCode.value._id);
  console.log('item',item);
  let $item = item?item:activeCode.value;
  let pass = $item.notePass?` 密码:${$item.notePass}`:'';
  let url = `${$item.noteTitle} https://${window.location.host}/share?shareId=${$item._id}${pass}`
  navigator.clipboard.writeText(url).then(()=>{
    layer.msg('复制成功,去分享吧!')
  });
}


async function getDownloadData(codeId,isClick){
  let {code,data,msg} = await getCode(codeId,isClick);
  // console.log('getDownloadData',data);
  
  return data
}

function download(item){
  getDownloadData(item._id).then(res=>{
    // console.log('res',res);
    const stringData = res.noteContent;
    // dada 表示要转换的字符串数据，type 表示要转换的数据格式
    const blob = new Blob([stringData], {
      type: 'text/markdown'
    })
    // 根据 blob生成 url链接
    const objectURL = URL.createObjectURL(blob)

    // 创建一个 a 标签Tag
    const aTag = document.createElement('a')
    // 设置文件的下载地址
    aTag.href = objectURL
    // 设置保存后的文件名称
    aTag.download = "markdown文件.md"
    // 给 a 标签添加点击事件
    aTag.click()
    // 释放一个之前已经存在的、通过调用 URL.createObjectURL() 创建的 URL 对象。
    // 当你结束使用某个 URL 对象之后，应该通过调用这个方法来让浏览器知道不用在内存中继续保留对这个文件的引用了。
    URL.revokeObjectURL(objectURL)
  })
}

// 编辑器
let subfield = ref(true);
let defaultOpen = ref('preview');

// 内容变化状态
let hasContentChanged = ref(false);
let originalContent = ref('');

//分享密码
let shouwShareCode = ref(false);
let sharePassForm = ref({notePass:'',_id:''});
async function confirmSharePass(){
  console.log('sharePassForm',sharePassForm.value);
  let {code,data,msg} = await setSharePass(sharePassForm.value);
  layer.msg(msg)
}

// 监听内容变化
function onContentChange(value, render) {
  // 检查内容是否真的发生了变化
  if (activeCode.value._id && value !== originalContent.value) {
    hasContentChanged.value = true;
  } else {
    hasContentChanged.value = false;
  }
}

const _this= instance.appContext.config.globalProperties;
function onContextMenu(item,e) {
  sharePassForm.value = item;
  // console.log('e.x',e.x);
  // console.log('e.y',e.y);
    //prevent the browser's default menu
    e.preventDefault();
    //shou our menu
    _this.$contextmenu({
      x: e.x,
      y: - e.y,
      zIndex:10001,
      items: [
        { 
          label: "分享密码", 
          onClick: () => {
            shouwShareCode.value = true
          }
        },
        { 
          label: "更改标题", 
          onClick: () => {
            editCodeTitle(item)
          }
        },
        { 
          label: "分享", 
          onClick: () => {
            share(item)
          }
        },
        { 
          label: "下载", 
          onClick: () => {
            download(item)
          }
        },
        { 
          label: "删除", 
          onClick: () => {
            delCode(item._id)
          }
        },
      ]
    });
  }

</script>

<template>
  <div class="parent" :style="{ gridTemplateColumns: isMobile ? '1fr' : `${columnWidths.foldersInfo}px 4px ${columnWidths.list}px 4px 1fr` }">
    <!-- 第一列：Folders + Info -->
    <div class="folders-info-container">
      <Folders class="folders" :folderList="folderList" :userId="state.userInfo.userId" @folderClick="onFolderClick" @getFolders="handleGetFolders"/>
      <section class="info">
        <div class="user-info" v-if="state.loginState&&state.userInfo">
          <a href="https://mynote.authing.cn/u" target="_blank" rel="noopener noreferrer">
            <img class="photo" :src="state.userInfo.photo" alt="">
          </a>
          <p class="nickname"><a href="https://mynote.authing.cn/u" target="_blank" rel="noopener noreferrer">{{state.userInfo.nickname||'未设置'}}</a></p>
          <a href="https://mynote.authing.cn/u" style="display: block;" target="_blank" rel="noopener noreferrer">我的资料</a>
          <button style="margin-top:24px" @click="logout">退出</button>
        </div>
        <div v-else class="unlogin">
          <button @click="login">登录</button>
        </div>
      </section>
    </div>
    
    <!-- 第一个 resizer -->
    <div 
      v-if="!isMobile" 
      class="resizer first-resizer"
      :class="{ 'is-dragging': resizerState.isDragging && resizerState.activeResizer === 'first' }"
      @mousedown="startResize('first', $event)"
    >
      <div class="resizer-handle"></div>
    </div>
    
    <!-- 第二列：List -->
    <section class="list">
      <div class="top u-flex">
        <input class="input u-flex-1" v-model="keyword" @input="keywordChange" type="text" placeholder="搜索">
        <span class="add" @click="addCode">+</span>
      </div>
      <ul v-if="codeList.length>0" class="code-list">
        <li v-for="(item,index) in codeList" 
          @click="codeClick(item,index)" 
          @contextmenu="onContextMenu(item,$event)" 
          class="code-title u-flex u-row-between" 
          :class="[index==codeIndex?'active':'',item.notePass?'has-pass':'']" 
          :key="item.id">
            <span class="u-flex-1 ellipsis">{{ item.noteTitle }}</span>
            <!-- <span class="del" @click="delCode(item._id)">删除</span> -->
        </li>
      </ul>
      <div v-else class="tip">请先新增笔记</div>
      <div v-if="total>queryParams.pageSize" class="box pagination-box">
          <pagination ref="pagination" :continues="5" :pageNo="queryParams.pageNo" :pageSize="queryParams.pageSize" :total="total" @onChangePage="changePage($event)" />
      </div>
    </section>
    
    <!-- 第二个 resizer -->
    <div 
      v-if="!isMobile" 
      class="resizer second-resizer"
      :class="{ 'is-dragging': resizerState.isDragging && resizerState.activeResizer === 'second' }"
      @mousedown="startResize('second', $event)"
    >
      <div class="resizer-handle"></div>
    </div>
    
    <!-- 列表 结束 -->
    <section class="code">
      <mavon-editor 
        class="mavonEditor" 
        v-model="activeCode.noteContent" 
        @save="saveCode" 
        @change="onContentChange"
        :toolbars="toolbars" 
        :html="true" 
        codeStyle="atom-one-dark"
        :subfield="subfield"
        :defaultOpen="defaultOpen"
       />
    </section>

   

  <s3-layer
    v-model="showAddCode"
    :btn="['确认']"
    :closeBtn="2"
    area="400px"
    :title="codeOperateType == 'add' ? '新增笔记' : '编辑笔记标题'"
    @yes="confirmAddCode"
  >
    <div>
      <span style="margin-right:8px">笔记标题</span>
      <!-- <input type="text" v-model="addCodeForm.noteTitle" maxlength="20" placeholder="笔记标题"> -->
      <input
          v-if="codeOperateType == 'add'"
          type="text"
          v-model="addCodeForm.noteTitle"
          maxlength="20"
          placeholder="笔记标题"
        />
        <input
          v-else
          type="text"
          v-model="editCodeForm.noteTitle"
          maxlength="20"
          placeholder="笔记标题"
        />
    </div>
  </s3-layer>

  <s3-layer
    v-model="shouwShareCode"
    :btn="['确认']"
    :closeBtn="2"
    area="400px"
    title="分享密码"
    @yes="confirmSharePass"
  >
    <div>
      <div class="">{{sharePassForm.noteTitle}}</div>
      <span style="margin-right:8px">分享密码</span>
      <input type="text" v-model="sharePassForm.notePass" maxlength="18" placeholder="未设置分享密码">
    </div>
  </s3-layer>

  <s3-layer
    v-model="showDelCode"
    :btn="['确认删除']"
    :closeBtn="2"
    area="400px"
    title="删除"
    @yes="confirmDelCode"
  >
    <div>
      <span style="margin-right:8px">确认删除-{{sharePassForm.noteTitle}}-笔记？</span>
    </div>
  </s3-layer>

  <div v-if="showLoading" class="loading u-flex">
    <div class="spinner-box">
      <div class="circle-border">
        <div class="circle-core"></div>
      </div>  
    </div>
  </div>

  <!-- 右下角按钮组 -->
  <div class="bottom-buttons" v-if="activeCode._id">
    <button class="save-btn" v-if="hasContentChanged" @click="saveCode">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 21V13H7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 3V8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      保存
    </button>
    <button class="share-btn" @click="share()">分享</button>
  </div>

  </div>
</template>

<style lang="scss" scoped>
.parent {
  .tip{
        text-align: center;
        color: #65698b;
        padding-top: 24px;
      }
    color: #fff;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 300px 4px 400px 4px 1fr; /* 默认值，会被内联样式覆盖 */
    grid-template-rows: 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    background-color: var(--bg-color);
    height: 100vh;
    
    .folders-info-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      
      .folders {
        flex: 1;
        overflow-y: auto;
      }
      
      .info {
        height: 360px;
        flex-shrink: 0;
        padding-top: 24px;
        text-align: center;
        
        .user-info{
          .photo{
            width: 80px;
            height: 80px;
            border-radius: 50%;
          }
        }
      }
    }
    
    .resizer {
      width: 4px;
      background-color: transparent;
      cursor: col-resize;
      position: relative;
      z-index: 10;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &.is-dragging {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .resizer-handle {
        width: 100%;
        height: 100%;
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 2px;
          height: 40px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 1px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
      }
      
      &:hover .resizer-handle::before,
      &.is-dragging .resizer-handle::before {
        opacity: 1;
      }
    }
    
    .list{
        position: relative;
        border-left: 1px solid var(--border-color);
        border-right: 1px solid var(--border-color);
        height: 100vh;
        overflow-y: auto;
        
      .top{
        border-bottom: 1px solid var(--border-color);
        .input{
          background: transparent;
          outline: 0;
          border: 0;
          box-shadow: none;
          height: 45px;
          padding: 0;
          margin-left: 10px;
          color: #fff;
          font-size: 16px;
        }
        .add{
          width: 45px;
          height: 45px;
          text-align: center;
          line-height: 45px;
          cursor: pointer;
          font-size: 30px;
          &:hover{
            background: #ddd;
          }
        }
      }
      .code-list{
        padding: 10px;
        list-style: none;
        .code-title{
            padding: 5px 10px;
            border-radius: 5px;
            position: relative;
            &::before{
              content:'';
              width: 4px;
              height: 4px;
              background-color: #65698b;
              margin-right: 8px;
            }
            &.has-pass{
              &::before{
                background-color: crimson;
              }
            }
            cursor: pointer;
            .del{
              display: none;
            }
            &:hover{
              background-color: #2a2d53;
              .del{
                display: block;
              }
            }
            &.active{
              background-color: #363748;
            }
          }
      }
      .pagination-box{
        position: absolute;
        left: 10px;
        right:0;
        bottom: 0;
        :deep(button) {
          padding: 0;
        }
      }
    }
    .code{
        height: 100vh;
        .mavonEditor{
          height: 100%;
        }
        :deep(.hljs){
          white-space: break-spaces;
        }
    }
}
@keyframes spin {
  from {
    transform: rotate(0);
  }
  to{
    transform: rotate(359deg);
  }
}
.loading{
  position: fixed;
  left: 0;
  right: 0;
  bottom:0;
  top: 0;
  background-color: rgba(0,0,0,.5);
  z-index: 100011;
  justify-content: center;
  .spinner-box {
    width: 300px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    .circle-border {
      width: 150px;
      height: 150px;
      padding: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      background: rgb(63,249,220);
      background: linear-gradient(0deg, rgba(63,249,220,0.1) 33%, rgba(63,249,220,1) 100%);
      animation: spin .8s linear 0s infinite;
    }

    .circle-core {
      width: 100%;
      height: 100%;
      background-color: #1d2630;
      border-radius: 50%;
    }
  }
}

.bottom-buttons {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10011;
}

.save-btn, .share-btn {
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  min-width: 80px;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    flex-shrink: 0;
  }
}

.save-btn {
  background: #4CAF50;
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  
  &:hover {
    background: #45a049;
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
  }
}

.share-btn {
  background: #2a2d53;
  color: white;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  
  &:hover {
    background: #2a2d53;
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
  }
}

@media screen and (max-width: 1200px) {
  .parent{
    display: block;
    height: auto;
    
    .resizer {
      display: none;
    }
    
    .folders-info-container {
      display: block;
      height: auto;
      
      .folders {
        height: auto;
        overflow-y: visible;
      }
      
      .info {
        display: none;
      }
    }
    
    .list{
      padding-bottom: 24px;
      height: auto;
      overflow-y: visible;
      
      .code-list{
        overflow: hidden;
        .code-title{
          width: 50%;
          box-sizing: border-box;
          float: left;
        }
      }
      .pagination-box{
        bottom: 10px;
      }
    }
  }
}
</style>
