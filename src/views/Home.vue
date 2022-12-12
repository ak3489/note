<script setup>
import { ref,onMounted,watch,getCurrentInstance,reactive  } from 'vue';
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
import Pagination from '../components/pagination'
import Folders from '../components/Folders.vue'
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
    sdk.loginWithRedirect();
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
// function folderClick(item,index){
//   queryParams.value.pageNo = 1;
//   folderIndex.value = index
// }

function onFolderClick(e){
  queryParams.value.pageNo = 1;
  folderIndex.value = e
  // console.log('onFolderClick',e);
}

let codeIndex = ref(0);
let codeList = ref([]);
function codeClick(item,index){
  activeCode.value = item;
  codeIndex.value = index;
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
  layer.msg(msg)
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
  codeIndex.value = 0;
  total.value = totalCount;
  showLoading.value = false;
  activeCode.value = {};
  if(data.length>0){
    let codeId = data[0]._id;
    handleGetCode(codeId)
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
  activeCode.value = data
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
watch(keyword, (newVal, oldVal) => { 
  console.log('keyword',newVal)
  if(keyword.value.length>0){
    debounce(seachCode(), 500, false);
  }else{
    handleGetCodeList()
  }
  
})

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

//分享密码
let shouwShareCode = ref(false);
let sharePassForm = ref({notePass:'',_id:''});
async function confirmSharePass(){
  console.log('sharePassForm',sharePassForm.value);
  let {code,data,msg} = await setSharePass(sharePassForm.value);
  layer.msg(msg)
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
  <div class="parent">
    <Folders class="folders" :folderList="folderList" :userId="state.userInfo.userId" @folderClick="onFolderClick" @getFolders="handleGetFolders"/>
    <!-- folders 结束 -->
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
     <!-- 信息 结束 -->
    <section class="list">
      <div class="top u-flex">
        <input class="input u-flex-1" v-model="keyword" type="text" placeholder="搜索">
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
    <!-- 列表 结束 -->
    <section class="code">
      <mavon-editor 
        class="mavonEditor" 
        v-model="activeCode.noteContent" 
        @save="saveCode" 
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
          maxlength="10"
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

  <button class="bottom-btn" v-if="activeCode._id" @click="share()">分享</button>

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
    grid-template-columns: 300px 400px 1fr;
    grid-template-rows: 360px 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    background-color: var(--bg-color);
    .info{
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
    .list{
        position: relative;
        grid-area: 1 / 2 / 3 / 3;
        border-left: 1px solid var(--border-color);
        border-right: 1px solid var(--border-color);
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
        bottom: 0;
        :deep(button) {
          padding: 0;
        }
      }
    }
    .code{
        grid-area: 1 / 3 / 3 / 3;
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
@media screen and (max-width: 1200px) {
  .parent{
    display: block;
    .list{
      padding-bottom: 24px;
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

    .info{
      display: none;
    }

  }
  
  
}
</style>
