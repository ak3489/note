<script setup>
import { ref,onMounted,watch,getCurrentInstance,reactive,toRefs  } from 'vue';
import { addFolderApi,getFolders,getCodeList,addCodeApi,getCode,saveCodeApi,delCodeApi,editFolderApi,seachCodeApi} from '@/service/index';
import { Authing } from '@authing/web';
import { debounce } from '@/utils/debounce';
import Pagination from '../components/pagination'
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
  userInfo: null,
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
  addFolderForm.value.userId=userInfo.userId;
  addCodeForm.value.userId=userInfo.userId
  state.userInfo = userInfo;
  handleGetFolders()
};

/**
 * 登出
 */
  const logout = () => {
  sdk.logoutWithRedirect();
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
function folderClick(item,index){
  folderIndex.value = index
}

let codeIndex = ref(0);
let codeList = ref([]);
function codeClick(item,index){
  activeCode.value = item;
  codeIndex.value = index;
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
  let {code,data,msg} = await getFolders(userId);
  folderList.value = data;
  handleGetCodeList()
}
let queryParams = ref({
  pageNo: 1,
  pageSize: 10,
})
let total = reactive(1)
async function handleGetCodeList(){
  let folderId = folderList.value[folderIndex.value]?._id;
  // console.log('folderId',folderId);
  let {code,data,totalCount,msg} = await getCodeList(folderId,queryParams.value.pageNo,queryParams.value.pageSize);
  codeList.value = data;
  total = totalCount
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

async function handleGetCode(codeId){
  let {code,data,msg} = await getCode(codeId);
  activeCode.value = data
}

let showAddFolder = ref(false);
let folderTool = ref('');
let editFolderForm = ref();
let addFolderForm = ref(
  {folderName:'',userId:''}
);
function addFolder(){
  folderTool.value = 'add';
  showAddFolder.value = true
}
async function confirmAddFolder(){
  console.log('folderTool.value',folderTool.value);
  // console.log('addFolderForm',addFolderForm.value);
  let hasType = folderList.value.some(function(item){
    console.log('item',item);
    console.log('folderList.value.folderName',folderList.value.folderName);
    return item.folderName == addFolderForm.value.folderName
  });
  if (hasType){layer.msg('已经有了');return false};

  showAddFolder.value = false;
  if(folderTool.value=='add'){
    let {code,data,msg} = await addFolderApi(addFolderForm.value);
    layer.msg(msg);
  }else if(folderTool.value=='edit'){
    console.log('addFolderForm.value',addFolderForm.value);
    editFolderForm.value.folderName = addFolderForm.value.folderName;
    let {code,data,msg} = await editFolderApi(editFolderForm.value);
    layer.msg(msg);
  }
  handleGetFolders()
}

function editFolder(item){
  editFolderForm.value = item;
  showAddFolder.value = true;
  folderTool.value = 'edit';
}

let showAddCode = ref(false);
let addCodeForm = ref(
  {noteTitle:'',folderId:'',noteContent:''}
);
async function confirmAddCode(){
  console.log('addCodeForm',addCodeForm.value);
  let {code,data,msg} = await addCodeApi(addCodeForm.value);
  layer.msg(msg);
  handleGetCodeList()
  showAddCode.value = false
}
function addCode(){
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
  codeIndex.value = 0;
  handleGetCodeList()
})
watch(codeIndex, (newVal, oldVal) => { 
  // console.log(newVal)
  handleGetCode(activeCode.value._id)
})

let keyword = ref('');
async function seachCode(){
  let userId = state.userInfo?.userId;
  let {code,data,msg} = await seachCodeApi(userId,keyword.value);
  codeList.value = data
}
watch(keyword, (newVal, oldVal) => { 
  console.log('keyword',newVal)
  debounce(seachCode(), 500, false);
})


</script>

<template>
  <div class="parent">
    <section class="folders">
        <div class="title u-flex u-row-between">
            <span>文件夹</span>
            <span class="add-folder" @click="addFolder">+</span>
        </div>
        <ul v-if="folderList.length>0" class="folder-list">
          <li v-for="(item,index) in folderList" @click="folderClick(item,index)" class="folder u-flex u-row-between" :class="index==folderIndex?'active':''" :key="item._id">
             <span class="u-flex-1">{{ item.folderName }}</span>
             <span @click="editFolder(item)" class="edit">编辑</span>
          </li>
        </ul>
        <div v-else class="tip">还没有文件夹,请先新增</div>
    </section> 
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
        <li v-for="(item,index) in codeList" class="code-title u-flex u-row-between" :class="index==codeIndex?'active':''" :key="item.id">
            <span  @click="codeClick(item,index)" class="u-flex-1">{{ item.noteTitle }}</span>
            <span class="del" @click="delCode(item._id)">删除</span>
        </li>
      </ul>
      <div v-else class="tip">请先新增笔记</div>
      <div v-if="total>queryParams.pageSize" class="box pagination-box">
          <pagination ref="pagination" :continues="5" :pageNo="queryParams.pageNo" :pageSize="queryParams.pageSize" :total="total" @onChangePage="changePage($event)" />
      </div>
    </section>
    <!-- 列表 结束 -->
    <section class="code">
      <mavon-editor class="mavonEditor" v-model="activeCode.noteContent" @save="saveCode" :toolbars="toolbars" />
    </section>

    <s3-layer
    v-model="showAddFolder"
    :btn="['确认']"
    :closeBtn="2"
    area="400px"
    :title="folderTool=='add'?'新增文件夹':'编辑文件夹'"
    @yes="confirmAddFolder"
  >
    <div>
      <span style="margin-right:8px">文件夹名称</span>
      <input type="text" v-model="addFolderForm.folderName" placeholder="文件夹名称">
    </div>
  </s3-layer>

  <s3-layer
    v-model="showAddCode"
    :btn="['确认']"
    :closeBtn="2"
    area="400px"
    title="新增笔记"
    @yes="confirmAddCode"
  >
    <div>
      <span style="margin-right:8px">笔记标题</span>
      <input type="text" v-model="addCodeForm.noteTitle" placeholder="笔记标题">
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
      <span style="margin-right:8px">确认删除笔记？</span>
    </div>
  </s3-layer>

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
    background-color: #292a36;
    .folders{
        padding: 10px;
        overflow-y: auto;
        .add-folder{
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          cursor: pointer;
          &:hover{
            background: #ddd;
          }
        }
        .folder-list{
          .folder{
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            .edit{
              display: none;
            }
            &:hover{
              .edit{
                display: block;
              }
            }
            &.active{
              background-color: #484c85;
            }
          }
        }
    }
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
        grid-area: 1 / 2 / 3 / 3;
        border-left: 1px solid #37394a;
        border-right: 1px solid #37394a;
      .top{
        border-bottom: 1px solid #37394a;
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
            cursor: pointer;
            .del{
              display: none;
            }
            &:hover{
              .del{
                display: block;
              }
            }
            &.active{
              background-color: #363748;
            }
          }
      }
    }
    .code{
        grid-area: 1 / 3 / 3 / 3;
        .mavonEditor{
          height: 100%;
        }
    }
}
</style>
